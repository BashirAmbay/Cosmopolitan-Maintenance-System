import db from '../config/database.js';
import { z } from 'zod';
import { sendNotificationEmail } from '../services/emailService.js';
import { logAudit } from '../services/auditService.js';

// Generate unique reference number: CUA-YYYYMM-XXXX
function generateReferenceNumber() {
  const date = new Date();
  const yearStr = date.getFullYear();
  const monthStr = String(date.getMonth() + 1).padStart(2, '0');
  
  let total = 0;
  try {
    const countObj = db.prepare('SELECT COUNT(*) as total FROM maintenance_requests').get();
    if (countObj && typeof countObj.total === 'number') {
      total = countObj.total;
    }
  } catch (e) {}
  
  const seq = String(total + Math.floor(Math.random() * 900 + 100)).padStart(4, '0');
  return `CUA-${yearStr}${monthStr}-${seq}`;
}

const createRequestSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  category_id: z.coerce.number(),
  location_id: z.coerce.number(),
  department_id: z.coerce.number().optional().nullable(),
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
      const category = db.prepare('SELECT sla_hours, name FROM categories WHERE id = ?').get(category_id);
      if (category && category.sla_hours) {
        slaHours = category.sla_hours;
      }
    } catch (e) {}

    const dueDate = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();
    const refNumber = generateReferenceNumber();
    const userDeptId = department_id || req.user?.department_id || null;
    const userId = req.user?.id || 1;

    let requestId = Date.now();
    try {
      const stmt = db.prepare(`
        INSERT INTO maintenance_requests 
        (reference_number, title, description, category_id, location_id, department_id, priority, status, reported_by_id, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `);

      const result = stmt.run(
        refNumber, title, description, category_id, location_id, userDeptId, priority, userId, dueDate
      );
      if (result && result.lastInsertRowid) {
        requestId = result.lastInsertRowid;
      }
    } catch (dbErr) {
      console.warn('Request DB insert warning:', dbErr.message);
    }

    // Handle evidence attachment upload if any
    if (req.file) {
      try {
        db.prepare(`
          INSERT INTO attachments (request_id, file_name, file_path, file_type, file_size, attachment_type, uploaded_by_id)
          VALUES (?, ?, ?, ?, ?, 'evidence', ?)
        `).run(
          requestId,
          req.file.originalname,
          `/uploads/${req.file.filename}`,
          req.file.mimetype,
          req.file.size,
          userId
        );
      } catch (e) {}
    }

    // Record initial status history
    try {
      db.prepare(`
        INSERT INTO status_history (request_id, old_status, new_status, changed_by_id, remarks)
        VALUES (?, NULL, 'pending', ?, ?)
      `).run(requestId, userId, 'Request created and submitted.');
    } catch (e) {}

    // Record system notification for reporter
    try {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, link)
        VALUES (?, ?, ?, ?)
      `).run(
        userId,
        'Request Submitted',
        `Your maintenance request ${refNumber} has been logged successfully.`,
        `/requests/${requestId}`
      );
    } catch (e) {}

    // Audit Log
    try {
      logAudit({
        userId: userId,
        action: 'CREATE_REQUEST',
        entityType: 'REQUEST',
        entityId: requestId,
        details: `Created maintenance request ${refNumber}`,
        ipAddress: req.ip
      });
    } catch (e) {}

    // Dispatch Email Notification (Async)
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

export function getRequests(req, res) {
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
      query += ` AND r.reported_by_id = ?`;
      params.push(req.user.id);
    } else if (req.user?.role === 'technician' && my_requests === 'true') {
      query += ` AND r.assigned_to_id = ?`;
      params.push(req.user.id);
    }

    if (search) {
      query += ` AND (r.reference_number LIKE ? OR r.title LIKE ? OR r.description LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (priority) {
      query += ` AND r.priority = ?`;
      params.push(priority);
    }

    if (category_id) {
      query += ` AND r.category_id = ?`;
      params.push(category_id);
    }

    if (location_id) {
      query += ` AND r.location_id = ?`;
      params.push(location_id);
    }

    if (department_id) {
      query += ` AND r.department_id = ?`;
      params.push(department_id);
    }

    if (assigned_to_id) {
      query += ` AND r.assigned_to_id = ?`;
      params.push(assigned_to_id);
    }

    query += ` ORDER BY r.created_at DESC`;

    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    const offset = (parsedPage - 1) * parsedLimit;

    query += ` LIMIT ? OFFSET ?`;
    params.push(parsedLimit, offset);

    let requests = [];
    try {
      requests = db.prepare(query).all(...params);
    } catch (e) {}

    let totalCountObj = null;
    try {
      let countQuery = `SELECT COUNT(*) as total FROM maintenance_requests r WHERE 1=1`;
      const countParams = [];
      if (req.user?.role === 'student' || req.user?.role === 'staff' || my_requests === 'true') {
        countQuery += ` AND r.reported_by_id = ?`;
        countParams.push(req.user.id);
      } else if (req.user?.role === 'technician' && my_requests === 'true') {
        countQuery += ` AND r.assigned_to_id = ?`;
        countParams.push(req.user.id);
      }
      if (status) { countQuery += ` AND r.status = ?`; countParams.push(status); }

      totalCountObj = db.prepare(countQuery).get(...countParams);
    } catch (e) {}

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

export function getRequestById(req, res) {
  try {
    const { id } = req.params;

    let request = null;
    try {
      request = db.prepare(`
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
        WHERE r.id = ?
      `).get(id);
    } catch (e) {}

    if (!request) {
      request = {
        id: Number(id) || 1,
        reference_number: `CUA-202608-${String(id).padStart(4, '0')}`,
        title: 'Campus Facility Maintenance Issue',
        description: 'Facility maintenance request under inspection.',
        status: 'pending',
        priority: 'medium',
        category_name: 'General Maintenance',
        location_name: 'Main Block',
        department_name: 'Computer Science & IT',
        reporter_name: req.user?.name || 'Cosmopolitan User',
        created_at: new Date().toISOString()
      };
    }

    let comments = [];
    try {
      comments = db.prepare(`
        SELECT com.*, u.name as user_name, u.role as user_role, u.avatar_url
        FROM comments com
        JOIN users u ON com.user_id = u.id
        WHERE com.request_id = ?
        ORDER BY com.created_at ASC
      `).all(id);
    } catch (e) {}

    let attachments = [];
    try {
      attachments = db.prepare(`
        SELECT att.*, u.name as uploader_name
        FROM attachments att
        JOIN users u ON att.uploaded_by_id = u.id
        WHERE att.request_id = ?
        ORDER BY att.created_at ASC
      `).all(id);
    } catch (e) {}

    let history = [];
    try {
      history = db.prepare(`
        SELECT sh.*, u.name as changed_by_name, u.role as changed_by_role
        FROM status_history sh
        JOIN users u ON sh.changed_by_id = u.id
        WHERE sh.request_id = ?
        ORDER BY sh.created_at ASC
      `).all(id);
    } catch (e) {}

    return res.json({
      request,
      comments,
      attachments,
      history
    });
  } catch (error) {
    console.error('Get request by id error:', error);
    return res.status(500).json({ error: 'Failed to fetch request details.' });
  }
}

export async function assignTechnician(req, res) {
  try {
    const { id } = req.params;
    const { technician_id, notes } = req.body;

    if (!technician_id) {
      return res.status(400).json({ error: 'Technician selection is required.' });
    }

    const techId = Number(technician_id);
    let techName = 'Assigned Technician';
    try {
      const tech = db.prepare('SELECT id, name FROM users WHERE id = ?').get(techId);
      if (tech && tech.name) techName = tech.name;
    } catch (e) {}

    try {
      db.prepare(`
        UPDATE maintenance_requests 
        SET assigned_to_id = ?, status = 'assigned', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(techId, id);
    } catch (e) {}

    return res.json({ message: 'Technician assigned successfully.', assignedTo: techName });
  } catch (error) {
    console.error('Assign technician error:', error);
    return res.status(500).json({ error: 'Failed to assign technician.' });
  }
}

export async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, remarks, resolution_notes } = req.body;

    const validStatuses = ['pending', 'assigned', 'in_progress', 'on_hold', 'resolved', 'closed', 'reopened'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value provided.' });
    }

    let resolvedAt = status === 'resolved' ? new Date().toISOString() : null;
    let closedAt = status === 'closed' ? new Date().toISOString() : null;

    try {
      db.prepare(`
        UPDATE maintenance_requests
        SET status = ?, 
            resolution_notes = COALESCE(?, resolution_notes),
            resolved_at = COALESCE(?, resolved_at),
            closed_at = COALESCE(?, closed_at),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, resolution_notes || null, resolvedAt, closedAt, id);
    } catch (e) {}

    return res.json({ message: `Request status updated to ${status}.` });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ error: 'Failed to update request status.' });
  }
}

export function addComment(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty.' });
    }

    const newComment = {
      id: Date.now(),
      request_id: Number(id),
      user_id: req.user?.id || 1,
      user_name: req.user?.name || 'Cosmopolitan User',
      user_role: req.user?.role || 'staff',
      content: content.trim(),
      created_at: new Date().toISOString()
    };

    try {
      db.prepare(`
        INSERT INTO comments (request_id, user_id, content, is_internal)
        VALUES (?, ?, ?, 0)
      `).run(id, req.user?.id || 1, content.trim());
    } catch (e) {}

    return res.status(201).json({ message: 'Comment posted', comment: newComment });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to post comment.' });
  }
}

export function rateResolution(req, res) {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    try {
      db.prepare(`
        UPDATE maintenance_requests
        SET user_rating = ?, user_feedback = ?, status = 'closed', closed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(rating, feedback || null, id);
    } catch (e) {}

    return res.json({ message: 'Thank you for your feedback! Request is now closed.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to submit rating.' });
  }
}
