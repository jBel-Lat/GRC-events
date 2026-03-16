const pool = require('../config/database');

function toCsvUrl(inputUrl) {
    if (!inputUrl) return '';
    const url = String(inputUrl).trim();
    if (!url) return '';

    if (url.includes('/export?') && url.includes('format=csv')) {
        return url;
    }

    const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!idMatch) return url;
    const sheetId = idMatch[1];

    const gidMatch = url.match(/[?&]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

function parseCsvLine(line) {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            out.push(cur);
            cur = '';
        } else {
            cur += ch;
        }
    }
    out.push(cur);
    return out.map((v) => v.trim());
}

function parseCsv(text) {
    const lines = String(text || '')
        .split(/\r?\n/)
        .filter((line) => line.trim() !== '');
    if (!lines.length) return [];

    const headers = parseCsvLine(lines[0]).map((h) => h.trim());
    return lines.slice(1).map((line) => {
        const cols = parseCsvLine(line);
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = cols[idx] || '';
        });
        return row;
    });
}

function normalizeDriveLink(link, type) {
    const raw = String(link || '').trim();
    if (!raw) return null;
    const idMatch =
        raw.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
        raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
        raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const fileId = idMatch ? idMatch[1] : null;
    if (!fileId) return raw;

    if (type === 'video') {
        return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

async function ensureSubmissionsTable(connection) {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS submissions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            event_id INT NULL,
            team_leader_name VARCHAR(255) NOT NULL,
            team_members_name TEXT NULL,
            problem_name VARCHAR(255) NULL,
            pdf_url TEXT NULL,
            video_url TEXT NULL,
            source_sheet_url TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_submission (team_leader_name, problem_name)
        )
    `);
}

exports.importFromGoogleSheet = async (req, res) => {
    try {
        const { sheet_url, event_id } = req.body || {};
        const csvUrl = toCsvUrl(sheet_url);
        if (!csvUrl) {
            return res.status(400).json({ success: false, message: 'sheet_url is required.' });
        }

        const response = await fetch(csvUrl, { method: 'GET' });
        if (!response.ok) {
            return res.status(400).json({ success: false, message: 'Unable to fetch Google Sheet CSV. Check sharing settings and URL.' });
        }
        const csvText = await response.text();
        const rows = parseCsv(csvText);

        const connection = await pool.getConnection();
        await ensureSubmissionsTable(connection);

        let imported = 0;
        let skipped = 0;
        const eventIdNum = Number(event_id);
        const eventId = Number.isFinite(eventIdNum) ? eventIdNum : null;

        for (const row of rows) {
            const teamLeader = row['Team Leader Name'] || '';
            const teamMembers = row['Team Members Name'] || '';
            const problemName = row['Problem Name'] || '';
            const rawPdf = row['Upload Project Documentation (PDF)'] || '';
            const rawVideo = row['Upload Project Demo Video'] || '';

            const pdfUrl = normalizeDriveLink(rawPdf, 'pdf');
            const videoUrl = normalizeDriveLink(rawVideo, 'video');

            if (!teamLeader || (!pdfUrl && !videoUrl)) {
                skipped += 1;
                continue;
            }

            await connection.query(
                `
                INSERT INTO submissions
                    (event_id, team_leader_name, team_members_name, problem_name, pdf_url, video_url, source_sheet_url)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    event_id = VALUES(event_id),
                    team_members_name = VALUES(team_members_name),
                    pdf_url = VALUES(pdf_url),
                    video_url = VALUES(video_url),
                    source_sheet_url = VALUES(source_sheet_url),
                    updated_at = CURRENT_TIMESTAMP
                `,
                [eventId, teamLeader, teamMembers || null, problemName || null, pdfUrl, videoUrl, sheet_url]
            );
            imported += 1;
        }

        connection.release();
        return res.json({
            success: true,
            data: { imported, skipped, totalRows: rows.length }
        });
    } catch (error) {
        console.error('importFromGoogleSheet error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getSubmissions = async (req, res) => {
    try {
        const eventIdNum = Number(req.query.event_id);
        const hasEvent = Number.isFinite(eventIdNum);
        const connection = await pool.getConnection();
        await ensureSubmissionsTable(connection);

        const [rows] = hasEvent
            ? await connection.query(
                `SELECT * FROM submissions WHERE event_id = ? ORDER BY updated_at DESC`,
                [eventIdNum]
            )
            : await connection.query(
                `SELECT * FROM submissions ORDER BY updated_at DESC`
            );
        connection.release();
        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error('getSubmissions error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
