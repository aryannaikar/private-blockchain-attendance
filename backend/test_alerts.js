const fs = require('fs');
const path = require('path');

const attendancePath = path.join(__dirname, 'data/attendance.json');
const dismissedPath = path.join(__dirname, 'data/dismissed.json');

try {
  const records = JSON.parse(fs.readFileSync(attendancePath));
  let dismissed = [];
  if (fs.existsSync(dismissedPath)) {
    dismissed = JSON.parse(fs.readFileSync(dismissedPath));
  }
  
  const dismissedKeys = new Set(dismissed.map(d => `${d.deviceID}||${d.sessionID}`));
  
  const groups = {};
  for (const r of records) {
    const device  = r.deviceID  || "unknown";
    const session = r.sessionID || "default";
    if (device === "unknown") continue;

    const key = `${device}||${session}`;
    if (dismissedKeys.has(key)) continue;

    if (!groups[key]) {
      groups[key] = { deviceID: device, sessionID: session, students: new Set() };
    }
    groups[key].students.add(r.studentID);
  }

  const alerts = Object.values(groups)
    .filter(g => g.students.size > 1)
    .map(g => ({
      deviceID:  g.deviceID,
      sessionID: g.sessionID,
      students:  [...g.students]
    }));

  const output = {
    recordCount: records.length,
    groups: Object.keys(groups).map(k => ({ key: k, count: groups[k].students.size })),
    alerts: alerts
  };

  fs.writeFileSync(path.join(__dirname, 'data/test_output.json'), JSON.stringify(output, null, 2));
  console.log("Output written to data/test_output.json");
} catch (err) {
  console.error("Error:", err.message);
}
