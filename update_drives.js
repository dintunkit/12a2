const fs = require('fs');
const path = require('path');

const baseDir = '.';
const photosJsonPath = path.join(baseDir, 'photos_v2.json');

if (!fs.existsSync(photosJsonPath)) {
    console.error('photos_v2.json not found');
    process.exit(1);
}

// Function to scan directory recursively and return a set of relative paths and names
function scanDir(dir, base) {
    let results = {
        names: new Set(),
        relPaths: new Set()
    };
    
    if (!fs.existsSync(dir)) return results;
    
    function walk(currentDir) {
        const list = fs.readdirSync(currentDir);
        list.forEach(file => {
            const fullPath = path.join(currentDir, file);
            const stat = fs.statSync(fullPath);
            if (stat && stat.isDirectory()) {
                walk(fullPath);
            } else {
                const rel = path.relative(base, fullPath).replace(/\\/g, '/');
                results.names.add(file.toLowerCase());
                results.relPaths.add(rel.toLowerCase());
            }
        });
    }
    
    walk(dir);
    return results;
}

console.log('Scanning Drives...');
const drive1 = scanDir(path.join(baseDir, 'Drive_1'), path.join(baseDir, 'Drive_1'));
const drive2 = scanDir(path.join(baseDir, 'Drive_2'), path.join(baseDir, 'Drive_2'));
const drive3 = scanDir(path.join(baseDir, 'Drive_3'), path.join(baseDir, 'Drive_3'));

const drives = {
    1: drive1,
    2: drive2,
    3: drive3
};

console.log(`Drive 1: ${drive1.names.size} files`);
console.log(`Drive 2: ${drive2.names.size} files`);
console.log(`Drive 3: ${drive3.names.size} files`);

// Read photos_v2.json
const rawData = fs.readFileSync(photosJsonPath, 'utf8');
const photos = JSON.parse(rawData);
console.log(`Loaded ${photos.length} photos from photos_v2.json`);

let matchedCount = 0;
let missingCount = 0;
const driveCounts = { 1: 0, 2: 0, 3: 0 };

const updatedPhotos = photos.map(photo => {
    const origPath = (photo.orig || '').replace(/\\/g, '/');
    const filename = path.basename(origPath).toLowerCase();
    
    // Strip "PTS/" if it exists
    let relUnderPts = origPath;
    if (origPath.toLowerCase().startsWith('pts/')) {
        relUnderPts = origPath.substring(4);
    }
    relUnderPts = relUnderPts.toLowerCase();
    
    let foundDrive = null;
    for (let d = 1; d <= 3; d++) {
        if (drives[d].relPaths.has(relUnderPts) || drives[d].names.has(filename)) {
            foundDrive = d;
            break;
        }
    }
    
    if (foundDrive) {
        matchedCount++;
        driveCounts[foundDrive]++;
        return {
            ...photo,
            drive: foundDrive
        };
    } else {
        missingCount++;
        if (missingCount <= 5) {
            console.log(`Could not map file: ${origPath} (filename: ${filename})`);
        }
        return photo;
    }
});

console.log(`\nMapping Summary:`);
console.log(`Matched: ${matchedCount} / ${photos.length}`);
console.log(`Missing: ${missingCount}`);
console.log(`Drive 1: ${driveCounts[1]}`);
console.log(`Drive 2: ${driveCounts[2]}`);
console.log(`Drive 3: ${driveCounts[3]}`);

// Write back to photos_v2.json
fs.writeFileSync(photosJsonPath, JSON.stringify(updatedPhotos, null, 2), 'utf8');
console.log(`\nSuccessfully updated photos_v2.json`);
