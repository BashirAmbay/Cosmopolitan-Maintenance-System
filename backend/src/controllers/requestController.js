import { dbAll, dbGet, dbRun } from '../config/database.js';
import { z } from 'zod';
import { sendNotificationEmail, sendTechnicianAssignmentEmail } from '../services/emailService.js';
import { logAudit } from '../services/auditService.js';

async function generateReferenceNumber() {
  const date = new Date();
  const yearStr = date.getFullYear();
  const monthStr = String(date.getMonth() + 1).padStart(2, '0');
  let total = 0;
  try {
    const countObj = await dbGet('SELECT COUNT(*) as total FROM maintenance_requests', []);
    if (countObj && typeof countObj.total === 'number') total = countObj.total;
  } catch (e) {}
  const seq = String(total + Math.floor(Math.random() * 900 + 100)).padStart(4, '0');
  return `CUA-${yearStr}${monthStr}-${seq}`;
}

async function resolveRequestId(idOrRef) {
  if (!idOrRef) return null;
  const str = String(idOrRef).trim();
  if (/^\d+$/.test(str)) {
    return Number(str);
  }
  const row = await dbGet('SELECT id FROM maintenance_requests WHERE reference_number = ?', [str]);
  return row ? row.id : null;
}

const createRequestSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  category_id: z.coerce.number().int().positive(),
  location_id: z.coerce.number().int().positive(),
  department_id: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || isNaN(Number(val)) || Number(val) <= 0 ? null : Number(val)),
    z.number().int().positive().nullable().optional()
  ),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium')
});

export async function createRequest(req, res) {
  try {
    const parse = createRequestSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
    }

    const { title, description, category_id, location_id, department_id, priority } = parse.data;

    let slaHours = 24;
    try {
      const category = await dbGet('SELECT sla_hours, name FROM categories WHERE id = ?', [category_id]);
      if (category && category.sla_hours) slaHours = category.sla_hours;
    } catch (e) {}

    const dueDate = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();
    const refNumber = await generateReferenceNumber();
    const userDeptId = (department_id && Number(department_id) > 0) ? Number(department_id) : (req.user?.department_id || null);
    
    // Ensure valid user ID for foreign key integrity
    let userId = req.user?.id;
    if (userId) {
      const userCheck = await dbGet('SELECT id FROM users WHERE id = ?', [userId]);
      if (!userCheck && req.user?.email) {
        const userByEmail = await dbGet('SELECT id FROM users WHERE email = ?', [req.user.email.toLowerCase()]);
        if (userByEmail) {
          userId = userByEmail.id;
        } else {
          const validDept = (userDeptId && Number(userDeptId) > 0) ? Number(userDeptId) : null;
          const newUser = await dbRun(
            'INSERT INTO users (name, email, password_hash, role, department_id, phone, specialization) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.name || 'Campus User', req.user.email.toLowerCase(), '$2a$10$wE0P7hZzYc6rC8F13', req.user.role || 'student', validDept, req.user.phone || null, req.user.specialization || null]
          );
          userId = newUser.lastInsertRowid;
        }
      }
    }
    if (!userId) {
      const fallbackUser = await dbGet('SELECT id FROM users LIMIT 1');
      userId = fallbackUser?.id || 1;
    }

    const result = await dbRun(
      `INSERT INTO maintenance_requests 
       (reference_number, title, description, category_id, location_id, department_id, priority, status, reported_by_id, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [refNumber, title, description, category_id, location_id, userDeptId, priority, userId, dueDate]
    );

    let requestId = result.lastInsertRowid;
    if (!requestId || requestId === 0) {
      const createdRow = await dbGet('SELECT id FROM maintenance_requests WHERE reference_number = ?', [refNumber]);
      requestId = createdRow?.id;
    }

    if (!requestId) {
      console.error('Failed to create maintenance request: row was not inserted into database.');
      return res.status(500).json({ error: 'Failed to record maintenance request in database.' });
    }

    if (req.file) {
      try {
        await dbRun(
          `INSERT INTO attachments (request_id, file_name, file_path, file_type, file_size, attachment_type, uploaded_by_id) VALUES (?, ?, ?, ?, ?, 'evidence', ?)`,
          [requestId, req.file.originalname, `/uploads/${req.file.filename}`, req.file.mimetype, req.file.size, userId]
        );
      } catch (e) {
        console.error('Attachment insert warning:', e.message);
      }
    }

    try {
      await dbRun(
        `INSERT INTO status_history (request_id, old_status, new_status, changed_by_id, remarks) VALUES (?, NULL, 'pending', ?, ?)`,
        [requestId, userId, 'Request created and submitted.']
      );
    } catch (e) {}

    try {
      await dbRun(
        `INSERT INTO notifications (user_id, title, message, link) VALUES (?, ?, ?, ?)`,
        [userId, 'Request Submitted', `Your maintenance request ${refNumber} has been logged successfully.`, `/requests/${requestId}`]
      );
    } catch (e) {}

    try {
      logAudit({ userId, action: 'CREATE_REQUEST', entityType: 'REQUEST', entityId: requestId, details: `Created maintenance request ${refNumber}`, ipAddress: req.ip });
    } catch (e) {}

    if (req.user?.email) {
      sendNotificationEmail({
        to: req.user.email,
        subject: `Maintenance Request Logged - ${refNumber}`,
        requestRef: refNumber,
        title,
        status: 'Pending Assignment',
        details: `Your maintenance ticket for "${title}" has been registered. Expected resolution window: ${slaHours} hours.`,
        actionUrl: `${process.env.CLIENT_URL || 'https://cosmopolitan-maintenance.vercel.app'}/requests/${requestId}`
      }).catch(() => {});
    }

    return res.status(201).json({
      message: 'Maintenance request submitted successfully.',
      requestId,
      referenceNumber: refNumber
    });
  } catch (error) {
    console.error('Create request error:', error);
    return res.status(500).json({ error: 'Failed to create maintenance request.' });
  }
}

export async function getRequests(req, res) {
  try {
    const {
      search, status, priority, category_id, location_id, department_id,
      assigned_to_id, my_requests, limit = 50, page = 1
    } = req.query;

    let query = `
      SELECT 
        r.*,
        c.name as category_name, c.icon as category_icon,
        l.name as location_name, l.building as location_building, l.room_number,
        d.name as department_name,
        reporter.name as reporter_name, reporter.email as reporter_email,
        tech.name as technician_name, tech.email as technician_email, tech.phone as technician_phone
      FROM maintenance_requests r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN locations l ON r.location_id = l.id
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN users reporter ON r.reported_by_id = reporter.id
      LEFT JOIN users tech ON r.assigned_to_id = tech.id
      WHERE 1=1
    `;

    const params = [];

    if (req.user?.role === 'student' || req.user?.role === 'staff' || my_requests === 'true') {
      query += ` AND (r.reported_by_id = ? OR reporter.email = ?)`;
      params.push(req.user.id, req.user?.email || '');
    } else if (req.user?.role === 'technician' && my_requests === 'true') {
      query += ` AND r.assigned_to_id = ?`;
      params.push(req.user.id);
    }

    if (search) {
      query += ` AND (r.reference_number LIKE ? OR r.title LIKE ? OR r.description LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (status) { query += ` AND r.status = ?`; params.push(status); }
    if (priority) { query += ` AND r.priority = ?`; params.push(priority); }
    if (category_id) { query += ` AND r.category_id = ?`; params.push(category_id); }
    if (location_id) { query += ` AND r.location_id = ?`; params.push(location_id); }
    if (department_id) { query += ` AND r.department_id = ?`; params.push(department_id); }
    if (assigned_to_id) { query += ` AND r.assigned_to_id = ?`; params.push(assigned_to_id); }

    query += ` ORDER BY r.created_at DESC`;

    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    const offset = (parsedPage - 1) * parsedLimit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parsedLimit, offset);

    const requests = await dbAll(query, params);

    let countQuery = `SELECT COUNT(*) as total FROM maintenance_requests r LEFT JOIN users reporter ON r.reported_by_id = reporter.id WHERE 1=1`;
    const countParams = [];
    if (req.user?.role === 'student' || req.user?.role === 'staff' || my_requests === 'true') {
      countQuery += ` AND (r.reported_by_id = ? OR reporter.email = ?)`;
      countParams.push(req.user.id, req.user?.email || '');
    } else if (req.user?.role === 'technician' && my_requests === 'true') {
      countQuery += ` AND r.assigned_to_id = ?`;
      countParams.push(req.user.id);
    }
    if (status) { countQuery += ` AND r.status = ?`; countParams.push(status); }
    const totalCountObj = await dbGet(countQuery, countParams);

    return res.json({
      requests,
      pagination: {
        total: totalCountObj ? totalCountObj.total : requests.length,
        page: parsedPage,
        limit: parsedLimit
      }
    });
  } catch (error) {
    console.error('Get requests error:', error);
    return res.status(500).json({ error: 'Failed to fetch maintenance requests.' });
  }
}

export async function getRequestById(req, res) {
  try {
    const { id } = req.params;
    const isNumericId = !isNaN(Number(id)) && /^\d+$/.test(String(id).trim());

    const request = await dbGet(`
      SELECT 
        r.*,
        c.name as category_name, c.description as category_desc, c.icon as category_icon, c.sla_hours,
        l.name as location_name, l.building as location_building, l.floor as location_floor, l.room_number as location_room,
        d.name as department_name, d.code as department_code,
        reporter.name as reporter_name, reporter.email as reporter_email, reporter.phone as reporter_phone, reporter.role as reporter_role,
        tech.name as technician_name, tech.email as technician_email, tech.phone as technician_phone, tech.specialization as technician_spec
      FROM maintenance_requests r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN locations l ON r.location_id = l.id
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN users reporter ON r.reported_by_id = reporter.id
      LEFT JOIN users tech ON r.assigned_to_id = tech.id
      WHERE ${isNumericId ? '(r.id = ? OR r.reference_number = ?)' : 'r.reference_number = ?'}
    `, isNumericId ? [Number(id), id] : [id]);

    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found.' });
    }

    const actualId = request.id;

    const comments = await dbAll(`
      SELECT com.*, u.name as user_name, u.role as user_role, u.avatar_url
      FROM comments com
      LEFT JOIN users u ON com.user_id = u.id
      WHERE com.request_id = ?
      ORDER BY com.created_at ASC
    `, [actualId]);

    const attachments = await dbAll(`
      SELECT att.*, u.name as uploader_name
      FROM attachments att
      LEFT JOIN users u ON att.uploaded_by_id = u.id
      WHERE att.request_id = ?
      ORDER BY att.created_at ASC
    `, [actualId]);

    const history = await dbAll(`
      SELECT sh.*, u.name as changed_by_name, u.role as changed_by_role
      FROM status_history sh
      LEFT JOIN users u ON sh.changed_by_id = u.id
      WHERE sh.request_id = ?
      ORDER BY sh.created_at ASC
    `, [actualId]);

    return res.json({ 
      request, 
      comments: comments || [], 
      attachments: attachments || [], 
      history: history || [] 
    });
  } catch (error) {
    console.error('Get request by id error:', error);
    return res.status(500).json({ error: 'Failed to fetch request details.' });
  }
}

export async function assignTechnician(req, res) {
  try {
    const actualId = await resolveRequestId(req.params.id);
    if (!actualId) {
      return res.status(404).json({ error: 'Maintenance request not found.' });
    }

    const { technician_id, notes } = req.body;
    if (!technician_id) {
      return res.status(400).json({ error: 'Technician selection is required.' });
    }

    const techId = Number(technician_id);
    const tech = await dbGet('SELECT id, name, email FROM users WHERE id = ?', [techId]);
    const techName = tech?.name || 'Assigned Technician';

    await dbRun(
      `UPDATE maintenance_requests SET assigned_to_id = ?, status = 'assigned', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [techId, actualId]
    );

    try {
      await dbRun(
        `INSERT INTO assignments (request_id, technician_id, assigned_by_id, notes) VALUES (?, ?, ?, ?)`,
        [actualId, techId, req.user?.id || 1, notes || 'Assigned from dashboard.']
      );
    } catch (e) {}

    try {
      await dbRun(
        `INSERT INTO status_history (request_id, old_status, new_status, changed_by_id, remarks) VALUES (?, 'pending', 'assigned', ?, ?)`,
        [actualId, req.user?.id || 1, `Assigned to ${techName}. ${notes || ''}`.trim()]
      );
    } catch (e) {}

    // Fetch full request details for notification
    const reqDetails = await dbGet(`
      SELECT 
        r.*,
        c.name as category_name,
        l.name as location_name, l.building as location_building, l.floor as location_floor, l.room_number as location_room,
        reporter.name as reporter_name, reporter.email as reporter_email
      FROM maintenance_requests r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN locations l ON r.location_id = l.id
      LEFT JOIN users reporter ON r.reported_by_id = reporter.id
      WHERE r.id = ?
    `, [actualId]);

    // Send in-app notification to technician
    try {
      await dbRun(
        `INSERT INTO notifications (user_id, title, message, link) VALUES (?, ?, ?, ?)`,
        [
          techId,
          `New Task Assigned: ${reqDetails?.reference_number || 'Work Order'}`,
          `You have been assigned to maintenance issue: "${reqDetails?.title || 'Issue'}". Location: ${reqDetails?.location_name || 'Campus'}.`,
          `/requests/${reqDetails?.reference_number || actualId}`
        ]
      );
    } catch (e) {}

    // Send email notification to technician's email
    if (tech?.email) {
      const locationStr = [reqDetails?.location_name, reqDetails?.location_floor, reqDetails?.location_room]
        .filter(Boolean)
        .join(' - ');

      const clientUrl = process.env.CLIENT_URL || 'https://cosmopolitan-maintenance.vercel.app';
      const actionUrl = `${clientUrl.replace(/\/+$/, '')}/requests/${reqDetails?.reference_number || actualId}`;

      sendTechnicianAssignmentEmail({
        to: tech.email,
        technicianName: tech.name,
        assignedByName: req.user?.name || 'Administrator',
        requestRef: reqDetails?.reference_number || `CUA-${actualId}`,
        title: reqDetails?.title || 'Maintenance Work Order',
        priority: reqDetails?.priority || 'medium',
        category: reqDetails?.category_name || 'General Maintenance',
        location: locationStr || 'Cosmopolitan Campus Premises',
        description: reqDetails?.description || '',
        notes: notes || '',
        actionUrl
      }).catch(err => {
        console.error('[RequestController] Failed to send technician assignment email:', err.message);
      });
    }

    try {
      logAudit({
        userId: req.user?.id || 1,
        action: 'REQUEST_ASSIGNED',
        entityType: 'REQUEST',
        entityId: actualId,
        details: `Assigned request ${reqDetails?.reference_number || actualId} to ${techName} (${tech?.email})`,
        ipAddress: req.ip
      });
    } catch (auditErr) {}

    return res.json({ message: 'Technician assigned successfully.', assignedTo: techName });
  } catch (error) {
    console.error('Assign technician error:', error);
    return res.status(500).json({ error: 'Failed to assign technician.' });
  }
}

export async function updateStatus(req, res) {
  try {
    const actualId = await resolveRequestId(req.params.id);
    if (!actualId) {
      return res.status(404).json({ error: 'Maintenance request not found.' });
    }

    const { status, remarks, resolution_notes } = req.body;
    const validStatuses = ['pending', 'assigned', 'in_progress', 'on_hold', 'resolved', 'closed', 'reopened'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value provided.' });
    }

    const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;
    const closedAt = status === 'closed' ? new Date().toISOString() : null;

    await dbRun(
      `UPDATE maintenance_requests
       SET status = ?, 
           resolution_notes = COALESCE(?, resolution_notes),
           resolved_at = COALESCE(?, resolved_at),
           closed_at = COALESCE(?, closed_at),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, resolution_notes || null, resolvedAt, closedAt, actualId]
    );

    try {
      await dbRun(
        `INSERT INTO status_history (request_id, new_status, changed_by_id, remarks) VALUES (?, ?, ?, ?)`,
        [actualId, status, req.user?.id || 1, remarks || `Status changed to ${status}`]
      );
    } catch (e) {}

    return res.json({ message: `Request status updated to ${status}.` });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ error: 'Failed to update request status.' });
  }
}

export async function addComment(req, res) {
  try {
    const actualId = await resolveRequestId(req.params.id);
    if (!actualId) {
      return res.status(404).json({ error: 'Maintenance request not found.' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty.' });
    }

    const result = await dbRun(
      `INSERT INTO comments (request_id, user_id, content, is_internal) VALUES (?, ?, ?, 0)`,
      [actualId, req.user?.id || 1, content.trim()]
    );

    const newComment = {
      id: result.lastInsertRowid || Date.now(),
      request_id: actualId,
      user_id: req.user?.id || 1,
      user_name: req.user?.name || 'Cosmopolitan User',
      user_role: req.user?.role || 'staff',
      content: content.trim(),
      created_at: new Date().toISOString()
    };

    return res.status(201).json({ message: 'Comment posted', comment: newComment });
  } catch (error) {
    console.error('addComment error:', error);
    return res.status(500).json({ error: 'Failed to post comment.' });
  }
}

export async function rateResolution(req, res) {
  try {
    const actualId = await resolveRequestId(req.params.id);
    if (!actualId) {
      return res.status(404).json({ error: 'Maintenance request not found.' });
    }

    const { rating, feedback } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    await dbRun(
      `UPDATE maintenance_requests SET user_rating = ?, user_feedback = ?, status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [rating, feedback || null, actualId]
    );

    return res.json({ message: 'Thank you for your feedback! Request is now closed.' });
  } catch (error) {
    console.error('rateResolution error:', error);
    return res.status(500).json({ error: 'Failed to submit rating.' });
  }
}

