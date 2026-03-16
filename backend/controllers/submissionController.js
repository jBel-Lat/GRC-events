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
    const firstUrlMatch = raw.match(/https?:\/\/[^\s,]+/i);
    const source = firstUrlMatch ? firstUrlMatch[0] : raw;
    const idMatch =
        source.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
        source.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
        source.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const fileId = idMatch ? idMatch[1] : null;
    if (!fileId) return source;

    if (type === 'video') {
        return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

async function ensureSubmissionsTable(connection) {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS submissions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            team_name VARCHAR(255) NOT NULL,
            team_leader VARCHAR(255) NOT NULL,
            team_members TEXT NULL,
            problem_name VARCHAR(255) NULL,
            pdf_link TEXT NULL,
            video_link TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_submission (team_name, problem_name)
        )
    `);

    const alterStatements = [
        'ALTER TABLE submissions ADD COLUMN team_name VARCHAR(255) NULL',
        'ALTER TABLE submissions ADD COLUMN team_leader VARCHAR(255) NULL',
        'ALTER TABLE submissions ADD COLUMN team_members TEXT NULL',
        'ALTER TABLE submissions ADD COLUMN pdf_link TEXT NULL',
        'ALTER TABLE submissions ADD COLUMN video_link TEXT NULL'
    ];
    for (const sql of alterStatements) {
        try {
            await connection.query(sql);
        } catch (err) {
            if (!(err && (err.code === 'ER_DUP_FIELDNAME' || (err.message && err.message.toLowerCase().includes('duplicate column'))))) {
                throw err;
            }
        }
    }
}

exports.importFromGoogleSheet = async (req, res) => {
    try {
        const { sheet_url } = req.body || {};
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
        for (const row of rows) {
            const teamName = row['Team Name'] || '';
            const teamLeader = row['Team Leader Name'] || '';
            const teamMembers = row['Team Members Name'] || '';
            const problemName = row['Problem Name'] || '';
            const rawPdf = row['Upload Project Documentation (PDF)'] || '';
            const rawVideo = row['Upload Project Demo Video'] || '';

            const pdfUrl = normalizeDriveLink(rawPdf, 'pdf');
            const videoUrl = normalizeDriveLink(rawVideo, 'video');

            if (!teamName || !teamLeader || (!pdfUrl && !videoUrl)) {
                skipped += 1;
                continue;
            }

            await connection.query(
                `
                INSERT INTO submissions
                    (team_name, team_leader, team_members, problem_name, pdf_link, video_link)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    team_leader = VALUES(team_leader),
                    team_members = VALUES(team_members),
                    pdf_link = VALUES(pdf_link),
                    video_link = VALUES(video_link),
                    updated_at = CURRENT_TIMESTAMP
                `,
                [teamName, teamLeader, teamMembers || null, problemName || null, pdfUrl, videoUrl]
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
        const connection = await pool.getConnection();
        await ensureSubmissionsTable(connection);

        const [rows] = await connection.query(`SELECT * FROM submissions ORDER BY updated_at DESC`);
        connection.release();
        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error('getSubmissions error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
