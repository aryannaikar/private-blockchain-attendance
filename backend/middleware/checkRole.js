/**
 * checkRole middleware
 * 
 * Each backend node is started with a ROLE env variable (teacher/student/admin/unauthorized).
 * This middleware rejects any request where the client-sent role doesn't match
 * the node's configured ROLE, preventing cross-node abuse.
 */

const NODE_ROLE = process.env.NODE_ROLE || process.env.ROLE;

function checkRole(req, res, next) {

  // unauthorized node — block all attendance actions
  if (NODE_ROLE === "unauthorized") {
    return res.status(403).json({
      error: "This node is not authorized to perform any actions"
    });
  }

  // For attendance routes: validate role from body matches node role
  const clientRole = req.body.role;

  if (!clientRole) {
    return res.status(400).json({
      error: "role is required in request body"
    });
  }

  if (clientRole !== NODE_ROLE) {
    return res.status(403).json({
      error: `This node only serves '${NODE_ROLE}' requests. You sent role '${clientRole}'`
    });
  }

  next();
}

module.exports = checkRole;
