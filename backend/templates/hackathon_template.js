// Serves the Excel template. Prefers the exact provided file; falls back to generated layout if missing.
// Usage: const buf = buildTemplateBuffer();
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const thinBorder = {
    top: { style: 'thin', color: { rgb: 'BFBFBF' } },
    bottom: { style: 'thin', color: { rgb: 'BFBFBF' } },
    left: { style: 'thin', color: { rgb: 'BFBFBF' } },
    right: { style: 'thin', color: { rgb: 'BFBFBF' } },
};

function ensureCell(ws, r, c) {
    const ref = XLSX.utils.encode_cell({ r, c });
    if (!ws[ref]) ws[ref] = { v: '' };
    if (!ws[ref].s) ws[ref].s = {};
    return ws[ref];
}

function lockCell(cell, locked) {
    cell.s.protection = { locked: locked !== false };
}

function applyBorder(cell) {
    cell.s.border = thinBorder;
}

function buildGeneratedTemplateBuffer() {
    const wb = XLSX.utils.book_new();

    // ---------- Main sheet ----------
    const rows = [];
    // Title merged later; place value in A1
    rows.push(['HACKATHON EVENT', '']);
    rows.push(['', '']); // spacer

    const numTeams = 30;
    const membersPerTeam = 5;
    const startRow = 3; // 1-based row index in Excel, zero-based in array -> row 3 is index 2

    for (let i = 0; i < numTeams; i++) {
        // Team Name row
        rows.push(['Team Name', '']);
        // Member Name row (first member)
        rows.push(['Member Name', '']);
        // Remaining member rows (total 5 incl first)
        for (let m = 0; m < membersPerTeam - 1; m++) {
            rows.push(['', '']);
        }
        // spacer row
        rows.push(['', '']);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Merge title A1:B1
    ws['!merges'] = ws['!merges'] || [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });

    // Column widths
    ws['!cols'] = [{ wch: 18 }, { wch: 22 }];

    // Row heights (row index is 1-based for !rows)
    ws['!rows'] = ws['!rows'] || [];
    ws['!rows'][0] = { hpt: 24 }; // title row height
    for (let block = 0; block < numTeams; block++) {
        const spacerRowZeroBased = (startRow - 1) + block * 7 + 6; // zero-based spacer row index
        ws['!rows'][spacerRowZeroBased] = { hpt: 6 };
    }

    // Freeze top row below title (A2)
    ws['!pane'] = {
        state: 'frozen',
        ySplit: 1,
        topLeftCell: 'A2',
        activePane: 'bottomLeft',
    };

    // Title styling
    const titleA1 = ensureCell(ws, 0, 0);
    titleA1.s.font = { bold: true, sz: 16, color: { rgb: 'FFFFFF' } };
    titleA1.s.fill = { fgColor: { rgb: '5B9BD5' }, patternType: 'solid' };
    titleA1.s.alignment = { horizontal: 'center', vertical: 'center' };
    applyBorder(titleA1);

    const titleB1 = ensureCell(ws, 0, 1);
    titleB1.s = { ...titleA1.s };

    const labelFont = { bold: true, italic: true, sz: 12 };

    const totalRows = rows.length;
    for (let r = 2; r < totalRows; r++) { // zero-based index; starts at row 3 in Excel
        const posInBlock = (r - (startRow - 1)) % 7; // 0..6 within each block
        const isSpacer = posInBlock === 6;

        const cellA = ensureCell(ws, r, 0);
        const cellB = ensureCell(ws, r, 1);

        // Default lock
        lockCell(cellA, true);
        lockCell(cellB, true);

        if (isSpacer) continue;

        applyBorder(cellA);
        applyBorder(cellB);

        if (posInBlock === 0) {
            // Team Name row
            cellA.v = 'Team Name';
            cellA.s.font = labelFont;
            cellA.s.alignment = { horizontal: 'left', vertical: 'center' };
            lockCell(cellB, false); // editable team name
        } else if (posInBlock === 1) {
            // Member Name header row (also first member)
            cellA.v = 'Member Name';
            cellA.s.font = labelFont;
            cellA.s.alignment = { horizontal: 'left', vertical: 'center' };
            lockCell(cellB, false); // editable member
        } else {
            // Additional member rows
            lockCell(cellB, false);
        }
    }

    // Protect sheet
    ws['!protect'] = { password: 'hackathon' };

    XLSX.utils.book_append_sheet(wb, ws, 'Hackathon Import');

    // ---------- Guide sheet ----------
    const guide = [
        ['How to use'],
        [],
        ['This file contains 30 blank team slots.'],
        ['For each team block:'],
        ['- Enter the team name in column B on the same row as "Team Name".'],
        ['- Enter up to 5 members in column B starting on the same row as "Member Name".'],
        ['- Leave unused member rows blank.'],
        ['- Do not edit the labels in column A.'],
        [],
        ['Import parsing rule:'],
        ['When column A = Team Name, read column B as the team.'],
        ['When column A = Member Name, read column B of that row plus the next 4 rows as members.'],
    ];
    const guideWs = XLSX.utils.aoa_to_sheet(guide);
    guideWs['!cols'] = [{ wch: 95 }];
    XLSX.utils.book_append_sheet(wb, guideWs, 'Guide');

    // Return buffer
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true });
}

module.exports = function buildTemplateBuffer() {
    const filePath = path.join(__dirname, 'files', 'hackathon_30_teams_template.xlsx');
    try {
        return fs.readFileSync(filePath);
    } catch (err) {
        console.warn('Template file missing, using generated buffer:', err.message);
        return buildGeneratedTemplateBuffer();
    }
};
