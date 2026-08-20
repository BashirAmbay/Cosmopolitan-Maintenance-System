import db from '../config/database.js';
import { z } from 'zod';
import { sendNotificationEmail } from '../services/emailService.js';
import { logAudit } from '../services/auditService.js';

// Generate unique reference number: CUA-YYYYMM-XXXX
function generateReferenceNumber() {
  const date = new Date();
  const yearStr = date.getFullYear();
  const monthStr = String(date.getMonth() + 1).padStart(2, '0');
  
  const countObj = db.prepare('SELECT COUNT(*) as total FROM maintenance_requests').get();
  const seq = String(countObj.total + 1).padStart(4, '0');
  
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

    // Fetch category SLA hours
    const category = db.prepare('SELECT sla_hours, name FROM categories WHERE id = ?').get(category_id);
    const slaHours = category ? category.sla_hours : 24;
    const dueDate = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

    const refNumber = generateReferenceNumber();
    const userDeptId = department_id || req.user.department_id || null;

    const stmt = db.prepare(`
      INSERT INTO maintenance_requests 
      (reference_number, title, description, category_id, location_id, department_id, priority, status, reported_by_id, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `);

    const result = stmt.run(
      refNumber, title, description, category_id, location_id, userDeptId, priority, req.user.id, dueDate
    );
    const requestId = result.lastInsertRowid;

    // Handle evidence attachment upload if any
    if (req.file) {
      db.prepare(`
        INSERT INTO attachments (request_id, file_name, file_path, file_type, file_size, attachment_type, uploaded_by_id)
        VALUES (?, ?, ?, ?, ?, 'evidence', ?)
      `).run(
        requestId,
        req.file.originalname,
        `/uploads/${req.file.filename}`,
        req.file.mimetype,
        req.file.size,
        req.user.id
      );
    }

    // Record initial status history
    db.prepare(`
      INSERT INTO status_history (request_id, old_status, new_status, changed_by_id, remarks)
      VALUES (?, NULL, 'pending', ?, ?)
    `).run(requestId, req.user.id, 'Request created and submitted.');

    // Record system notification for reporter
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, link)
      VALUES (?, ?, ?, ?)
    `).run(
      req.user.id,
      'Request Submitted',
      `Your maintenance request ${refNumber} has been logged successfully.`,
      `/requests/${requestId}`
    );

    // Audit Log
    logAudit({
      userId: req.user.id,
      action: 'CREATE_REQUEST',
      entityType: 'REQUEST',
      entityId: requestId,
      details: `Created maintenance request ${refNumber}`,
      ipAddress: req.ip
    });

    // Dispatch Email Notification (Async)
    sendNotificationEmail({
      to: req.user.email,
      subject: `Maintenance Request Logged - ${refNumber}`,
      requestRef: refNumber,
      title,
      status: 'Pending Assignment',
      details: `Your maintenance ticket for "${title}" has been registered. Expected resolution window: ${slaHours} hours.`,
      actionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/requests/${requestId}`
    });

    res.status(201).json({
      message: 'Maintenance request submitted successfully.',
      requestId,
      referenceNumber: refNumber
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Failed to create maintenance request.' });
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

    // Role-based data scoping
    if (req.user.role === 'student' || req.user.role === 'staff' || my_requests === 'true') {
      query += ` AND r.reported_by_id = ?`;
      params.push(req.user.id);
    } else if (req.user.role === 'technician' && my_requests === 'true') {
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

    const requests = db.prepare(query).all(...params);

    // Count total for pagination metadata
    let countQuery = `SELECT COUNT(*) as total FROM maintenance_requests r WHERE 1=1`;
    const countParams = [];
    if (req.user.role === 'student' || req.user.role === 'staff' || my_requests === 'true') {
      countQuery += ` AND r.reported_by_id = ?`;
      countParams.push(req.user.id);
    } else if (req.user.role === 'technician' && my_requests === 'true') {
      countQuery += ` AND r.assigned_to_id = ?`;
      countParams.push(req.user.id);
    }
    if (status) { countQuery += ` AND r.status = ?`; countParams.push(status); }

    const totalCountObj = db.prepare(countQuery).get(...countParams);

    res.json({
      requests,
      pagination: {
        total: totalCountObj ? totalCountObj.total : requests.length,
        page: parsedPage,
        limit: parsedLimit
      }
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance requests.' });
  }
}

export function getRequestById(req, res) {
  try {
    const { id } = req.params;

    const request = db.prepare(`
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

    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found.' });
    }

    // Role check: Students can only view their own request
    if (req.user.role === 'student' && request.reported_by_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to view this request.' });
    }

    // Fetch comments
    const comments = db.prepare(`
      SELECT com.*, u.name as user_name, u.role as user_role, u.avatar_url
      FROM comments com
      JOIN users u ON com.user_id = u.id
      WHERE com.request_id = ?
      ORDER BY com.created_at ASC
    `).all(id);

    // Fetch attachments
    const attachments = db.prepare(`
      SELECT att.*, u.name as uploader_name
      FROM attachments att
      JOIN users u ON att.uploaded_by_id = u.id
      WHERE att.request_id = ?
      ORDER BY att.created_at ASC
    `).all(id);

    // Fetch status history timeline
    const history = db.prepare(`
      SELECT sh.*, u.name as changed_by_name, u.role as changed_by_role
      FROM status_history sh
      JOIN users u ON sh.changed_by_id = u.id
      WHERE sh.request_id = ?
      ORDER BY sh.created_at ASC
    `).all(id);

    res.json({
      request,
      comments,
      attachments,
      history
    });
  } catch (error) {
    console.error('Get request by id error:', error);
    res.status(500).json({ error: 'Failed to fetch request details.' });
  }
}

export async function assignTechnician(req, res) {
  try {
    const { id } = req.params;
    const { technician_id, notes } = req.body;

    if (!technician_id) {
      return res.status(400).json({ error: 'Technician selection is required.' });
    }

    const request = db.prepare('SELECT * FROM maintenance_requests WHERE id = ?').get(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    const techId = Number(technician_id);
    const tech = db.prepare('SELECT id, name, email, phone, specialization FROM users WHERE id = ?').get(techId);
    if (!tech) {
      return res.status(400).json({ error: 'Selected technician does not exist or is invalid.' });
    }

    const oldStatus = request.status;
    const newStatus = 'assigned';

    // Update request assignment
    db.prepare(`
      UPDATE maintenance_requests 
      SET assigned_to_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(techId, newStatus, id);

    // Record assignment log
    db.prepare(`
      INSERT INTO assignments (request_id, technician_id, assigned_by_id, notes)
      VALUES (?, ?, ?, ?)
    `).run(id, techId, req.user.id, notes || 'Assigned by Administrator');

    // Record status history
    db.prepare(`
      INSERT INTO status_history (request_id, old_status, new_status, changed_by_id, remarks)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, oldStatus, newStatus, req.user.id, `Assigned to technician ${tech.name}. ${notes || ''}`);

    // Create notifications for technician and reporter
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, link)
      VALUES (?, ?, ?, ?)
    `).run(
      techId,
      'New Maintenance Assignment',
      `You have been assigned request ${request.reference_number}: ${request.title}`,
      `/requests/${id}`
    );

    db.prepare(`
      INSERT INTO notifications (user_id, title, message, link)
      VALUES (?, ?, ?, ?)
    `).run(
      request.reported_by_id,
      'Technician Assigned',
      `Technician ${tech.name} has been assigned to handle your request ${request.reference_number}.`,
      `/requests/${id}`
    );

    // Send emails safely (non-blocking)
    sendNotificationEmail({
      to: tech.email,
      subject: `New Work Order Assignment - ${request.reference_number}`,
      requestRef: request.reference_number,
      title: request.title,
      status: 'Assigned',
      details: `You have been assigned a work order for "${request.title}". Notes: ${notes || 'None'}`,
      actionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/requests/${id}`
    }).catch(err => console.error('Background email notification error:', err?.message));

    res.json({ message: 'Technician assigned successfully.', assignedTo: tech.name });
  } catch (error) {
    console.error('Assign technician error:', error);
    res.status(500).json({ error: 'Failed to assign technician.' });
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

    const request = db.prepare('SELECT * FROM maintenance_requests WHERE id = ?').get(id);
    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found.' });
    }

    // Role checks: Technicians can update their assigned requests or unassigned pending issues (which auto-assigns to them). Admin & Management can update any request.
    if (req.user.role === 'technician' && request.assigned_to_id && request.assigned_to_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'management') {
      return res.status(403).json({ error: 'Technicians can only update their assigned requests or unassigned issues.' });
    }

    // Auto-assign to technician if updating an unassigned issue
    let assignedToId = request.assigned_to_id;
    if (req.user.role === 'technician' && !assignedToId) {
      assignedToId = req.user.id;
    }

    const oldStatus = request.status;
    let resolvedAt = request.resolved_at;
    let closedAt = request.closed_at;

    if (status === 'resolved') {
      resolvedAt = new Date().toISOString();
    } else if (status === 'closed') {
      closedAt = new Date().toISOString();
    }

    db.prepare(`
      UPDATE maintenance_requests
      SET status = ?, 
          assigned_to_id = COALESCE(?, assigned_to_id),
          resolution_notes = COALESCE(?, resolution_notes),
          resolved_at = ?,
          closed_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, assignedToId || null, resolution_notes || null, resolvedAt, closedAt, id);

    // Save evidence attachment if file was uploaded during resolution
    if (req.file) {
      db.prepare(`
        INSERT INTO attachments (request_id, file_name, file_path, file_type, file_size, attachment_type, uploaded_by_id)
        VALUES (?, ?, ?, ?, ?, 'resolution', ?)
      `).run(
        id,
        req.file.originalname,
        `/uploads/${req.file.filename}`,
        req.file.mimetype,
        req.file.size,
        req.user.id
      );
    }

    // Status History
    db.prepare(`
      INSERT INTO status_history (request_id, old_status, new_status, changed_by_id, remarks)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, oldStatus, status, req.user.id, remarks || `Status changed to ${status}`);

    // Notify Reporter
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, link)
      VALUES (?, ?, ?, ?)
    `).run(
      request.reported_by_id,
      `Request Status Updated: ${status.toUpperCase()}`,
      `Your request ${request.reference_number} is now ${status.replace('_', ' ')}.`,
      `/requests/${id}`
    );

    const reporter = db.prepare('SELECT email FROM users WHERE id = ?').get(request.reported_by_id);
    if (reporter) {
      sendNotificationEmail({
        to: reporter.email,
        subject: `Request Status Updated (${status.toUpperCase()}) - ${request.reference_number}`,
        requestRef: request.reference_number,
        title: request.title,
        status: status.replace('_', ' ').toUpperCase(),
        details: remarks || `Request status updated to ${status}. ${resolution_notes ? 'Resolution details: ' + resolution_notes : ''}`,
        actionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/requests/${id}`
      });
    }

    res.json({ message: `Request status updated to ${status}.` });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update request status.' });
  }
}

export function addComment(req, res) {
  try {
    const { id } = req.params;
    const { content, is_internal } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty.' });
    }

    const stmt = db.prepare(`
      INSERT INTO comments (request_id, user_id, content, is_internal)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(id, req.user.id, content.trim(), is_internal ? 1 : 0);

    const newComment = db.prepare(`
      SELECT com.*, u.name as user_name, u.role as user_role, u.avatar_url
      FROM comments com
      JOIN users u ON com.user_id = u.id
      WHERE com.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ message: 'Comment posted', comment: newComment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to post comment.' });
  }
}

export function rateResolution(req, res) {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    const request = db.prepare('SELECT * FROM maintenance_requests WHERE id = ?').get(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    if (request.reported_by_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the original submitter can rate the resolution.' });
    }

    db.prepare(`
      UPDATE maintenance_requests
      SET user_rating = ?, user_feedback = ?, status = 'closed', closed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(rating, feedback || null, id);

    db.prepare(`
      INSERT INTO status_history (request_id, old_status, new_status, changed_by_id, remarks)
      VALUES (?, ?, 'closed', ?, ?)
    `).run(id, request.status, req.user.id, `User rated resolution ${rating}/5 stars and confirmed request closure.`);

    res.json({ message: 'Thank you for your feedback! Request is now closed.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit rating.' });
  }
}
