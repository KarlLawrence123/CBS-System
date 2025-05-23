// Add SheetJS library
const script = document.createElement('script');
script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
document.head.appendChild(script);

// Add Font Awesome for theme toggle icons
const fontAwesome = document.createElement('link');
fontAwesome.rel = 'stylesheet';
fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
document.head.appendChild(fontAwesome);

// Theme toggle functionality
function initializeThemeToggle() {
    // Create theme toggle button
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    document.body.appendChild(themeToggle);

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    // Add click event listener
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Data structures to store scheduling information
let instructors = [];
let courses = [];
let rooms = [];
let schedules = [];
let sections = [];

// Specialization to subject code/title mapping
const specializationSubjectMap = {
   "General Education": [
        "ARTAP 103", "USELF 133", "RPH 103", "CONWORLD 103", "MMW 103", "ETHICS 203", "KONKOM 103", "RIZAL 203", "STS 103", "DALFIL 123", "PIC 103", 
        "PPC 113", "STAT", "STAT APP", "CES 103" , "SOCIO 223" , "LOGIC 313"],

    "Accounting and Finance": [
        "ACCTG 101" , "ACCTG 104" , "ACCTG 106" , "ACCTG 107" , "ACCTG 108" , "ACCTG 109" , "ACCTG 110" , "ACCTG 116" , "ACCTG 117" , "ACCTG ELECT 1" , 
        "BACC 201" , "BACC 301" , "BACC 305" , "BACC 401" , "BACC 501" , "BACC 702" , "BA FIN 101B" , "BA FIN 102" , "BA FIN 102B"],

    "Business, Management, and Economics": [
        "CBME 11", "CBME 21", "ECO 301B", "MANSCI", "STRATBUS", "LAW 2", "ORGMAN", "GOVBUSMAN"],

    "Information Systems / Accounting Info Systems": [
        "AIS 101" , "AIS ELEC 2" , "PRE 2" , "PRE 3" , "PRE 6" , "PRE 7" , "PRE 8"],

    "Marketing Courses": [
        "MKTG P101", "MKTG P301", "MKTG P302", "MKTG P303", "MKTG P304", "MKTG E404", "MKTG E407"],

    "Entrepreneurship / Innovation": [
        "ENTBE", "INNOMNGT", "PPENTDEV", "SOCENT", "ENT TRACK 1", "ENT TRACK 2", "ENT TRACK 3", "ENT TRACK 4",
         "ENT TRACK 5", "ENT ELECT 1" , "ENT ELECT 2", "ENT ELECT 5", "BUSP 1"],

    "Public Administration": [
        "BPA 1 ", "BPA 3", "BPA 4", "BPA 5", "BPA 6", "BPA E301", "BPA E301B", "BPA 11", "BPA 12", "BPA 13", "BPA 14", "BPA 15"],

    "Physical Education and Civic Training": [
        "PATHFit 112", "PATHFit 212", "NSTP 1",]
    // Add more as needed
};

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeThemeToggle();
    initializeNavigation();
    setupFileUpload();
    showDashboard(); // Show dashboard by default after login
});

// Navigation setup
function initializeNavigation() {
    const navLinks = {
        'dashboard-link': showDashboard,
        'scheduler-link': showScheduler,
        'teachers-link': showTeachers,
        'students-link': showStudents,
        'rooms-link': showRooms,
        'courses-link': showCourses,
        'auto-generate-link': showAutoGenerate,
        'instructor-schedule-link': showInstructorSchedule
    };

    for (const [id, handler] of Object.entries(navLinks)) {
        document.getElementById(id)?.addEventListener('click', function(e) {
            e.preventDefault();
            // Remove 'active' from all links
            document.querySelectorAll('.sidebar ul li a').forEach(link => link.classList.remove('active'));
            // Add 'active' to the clicked link
            this.classList.add('active');
            handler();
        });
    }
}

// File upload handling
function setupFileUpload() {
    const mainContent = document.getElementById('main-content');
    
    const uploadHtml = `
        <div class="file-upload-container">
            <h2>Upload Schedule Data</h2>
            <label class="file-upload-label" for="excel-upload">
                <div class="file-upload-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/>
                    </svg>
                </div>
                <div class="file-upload-text">Click to upload Excel file</div>
                <div class="file-upload-subtext">or drag and drop</div>
            </label>
            <input type="file" id="excel-upload" accept=".xlsx,.xls" style="display: none;">
            <div id="file-status" class="file-status"></div>
        </div>
        <div id="generation-results"></div>
    `;

    mainContent.innerHTML = uploadHtml;

    const fileInput = document.getElementById('excel-upload');
    const fileStatus = document.getElementById('file-status');
    const dropZone = document.querySelector('.file-upload-label');

    // File drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#2980b9';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#3498db';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length) {
            fileInput.files = files;
            handleFileUpload(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

// Handle file upload and processing
async function handleFileUpload(file) {
    const fileStatus = document.getElementById('file-status');
    const generationResults = document.getElementById('generation-results');
    
    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/)) {
        fileStatus.textContent = 'Please upload a valid Excel file (.xlsx or .xls)';
        fileStatus.className = 'file-status error';
        return;
    }
    
    try {
        fileStatus.textContent = 'Reading file...';
        fileStatus.className = 'file-status loading';
        
        // Ensure XLSX is loaded
        if (typeof XLSX === 'undefined') {
            throw new Error('Excel library is not loaded. Please refresh the page and try again.');
        }
        
        const data = await readExcelFile(file);
        
        // Update status
        fileStatus.textContent = 'Processing data...';
        
        // Process the Excel data
        processExcelData(data);
        
        // Show success message with data summary
        fileStatus.innerHTML = `
            <div class="success">
                Data loaded successfully!<br>
                Found:<br>
                - ${instructors.length} instructors<br>
                - ${sections.length} sections<br>
                - ${courses.length} courses<br>
                - ${rooms.length} rooms
            </div>
        `;
        fileStatus.className = 'file-status success';
        
        // Add generate button
        generationResults.innerHTML = `
            <button id="generate-schedule-btn" class="primary-btn">
                Generate Schedule
            </button>
        `;

        // Add event listener to generate button
        document.getElementById('generate-schedule-btn')?.addEventListener('click', () => {
            const schedule = generateSchedule();
        displayScheduleResults(schedule);
        });
        
    } catch (error) {
        console.error('Error processing file:', error);
        fileStatus.innerHTML = `
            <div class="error">
                Error processing file: ${error.message}<br>
                Please ensure your Excel file has the following sheets:<br>
                - Instructors (columns: Instructors, Specialization, Time, Day)<br>
                - Sections (columns: Course, Year_Level, Section, Students)<br>
                - Subjects (columns: Subject_Code, Descriptive_Title, Credit)<br>
                - Rooms (columns: Room, Day, Time_Slot, Max_Capacity)
            </div>
        `;
        fileStatus.className = 'file-status error';
    }
}

// Read Excel file using SheetJS
async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                
                const availableSheets = workbook.SheetNames;
                console.log('Available sheets:', availableSheets);
                // Required sheets and their expected columns (keys are uppercase for robust matching)
                const requiredSheets = {
                    'INSTRUCTOR': ['INSTRUCTOR', 'SPECIALIZATIONS', 'Time', 'Day'],
                    'SECTION': ['Course', 'Year Level', 'Section', 'Students'],
                    'SUBJECTS': ['Subject Code', 'Descriptive Title', 'Required Specialization', 'Credit'],
                    'ROOMS': ['Room', 'Day', 'Time Slot', 'Max Capacity']
                };
                // Check for missing sheets (case-insensitive)
                const missingSheets = Object.keys(requiredSheets).filter(sheet =>
                    !availableSheets.some(s => s.toUpperCase() === sheet.toUpperCase())
                );
                if (missingSheets.length > 0) {
                    throw new Error(`Missing required sheets: ${missingSheets.join(', ')}`);
                }
                // Convert sheets to JSON with header row mapping
                const result = {};
                Object.keys(requiredSheets).forEach(sheetName => {
                    // Find the actual sheet name (case-insensitive)
                    const actualSheetName = availableSheets.find(
                        name => name.toUpperCase() === sheetName.toUpperCase()
                    );
                    if (!actualSheetName) {
                        throw new Error(`Sheet '${sheetName}' not found in file.`);
                    }
                    const sheet = workbook.Sheets[actualSheetName];
                    if (!sheet) {
                        throw new Error(`Sheet "${sheetName}" is empty or invalid`);
                    }
                    
                    // Get the data with headers
                    const jsonData = XLSX.utils.sheet_to_json(sheet, {
                        header: 1,
                        blankrows: false
                    });
                    
                    // Verify we have data
                    if (jsonData.length < 2) {
                        throw new Error(`Sheet "${sheetName}" has no data rows`);
                    }
                    // Map header names to indices for robust parsing
                    const headerRow = jsonData[0].map(h => h && h.toString().trim());
                    const colIndex = {};
                    requiredSheets[sheetName].forEach(col => {
                        const idx = headerRow.findIndex(h => h && h.toLowerCase() === col.toLowerCase());
                        if (idx === -1) throw new Error(`Missing column '${col}' in sheet '${sheetName}'`);
                        colIndex[col] = idx;
                    });
                    // Special handling for each sheet
                    switch(sheetName.toUpperCase()) {
                        case 'INSTRUCTOR':
                            // Group specializations by professor and remove duplicates
                            const instructors = {};
                            let currentProfessor = null;
                            jsonData.slice(1).forEach((row, index) => {
                                const prof = row[colIndex['INSTRUCTOR']]?.toString().trim() || currentProfessor || '';
                                const spec = row[colIndex['SPECIALIZATIONS']]?.toString().trim() || '';
                                const time = row[colIndex['Time']]?.toString().trim() || '';
                                const day = row[colIndex['Day']]?.toString().trim() || '';
                                if (prof && prof !== 'empty') {
                                    currentProfessor = prof;
                                    if (!instructors[currentProfessor]) {
                                        instructors[currentProfessor] = {
                                            name: currentProfessor,
                                            specializations: new Set(),
                                            time: time || '7:00 am - 7:00 pm',
                                            day: day || 'Monday - Friday',
                                            availability: {
                                                days: day ? day.split('-').map(d => d.trim()) : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                                                time: time || '7:00 am - 7:00 pm'
                                            }
                                        };
                                    }
                                    // Always add specialization if present
                                    if (spec && spec !== 'empty' && spec !== 'SPECIALIZATIONS') {
                                        instructors[currentProfessor].specializations.add(spec);
                                    }
                                }
                            });
                            result.instructors = Object.values(instructors).map(instructor => ({
                                ...instructor,
                                specializations: Array.from(instructor.specializations)
                                    .filter(spec => spec && spec !== 'empty' && spec !== 'SPECIALIZATIONS')
                                    .sort()
                            }));
                            break;
                        case 'SECTION':
                            // Remove duplicate sections
                            const uniqueSections = new Map();
                            jsonData.slice(1)
                                .filter(row => row[colIndex['Course']])
                                .forEach(row => {
                                    const key = `${row[colIndex['Course']]}-${row[colIndex['Year Level']]}-${row[colIndex['Section']]}`;
                                    uniqueSections.set(key, {
                                        course: row[colIndex['Course']],
                                        yearLevel: row[colIndex['Year Level']],
                                        section: row[colIndex['Section']],
                                        students: parseInt(row[colIndex['Students']]) || 0
                                    });
                                });
                            result.sections = Array.from(uniqueSections.values());
                            break;
                        case 'SUBJECTS':
                            // Group subjects by the full course/year/sem label, handling merged/empty cells
                            const groupedSubjects = {};
                            let currentGroup = null;
                            jsonData.slice(1).forEach(row => {
                                // If the first cell is not empty, it's a new group
                                if (row[0] && row[0].toString().trim()) {
                                    currentGroup = row[0].toString().trim();
                                }
                                // Only add if we have a group and a subject code
                                if (currentGroup && row[colIndex['Subject Code']]) {
                                    if (!groupedSubjects[currentGroup]) groupedSubjects[currentGroup] = [];
                                    groupedSubjects[currentGroup].push({
                                        code: row[colIndex['Subject Code']],
                                        title: row[colIndex['Descriptive Title']],
                                        credit: parseInt(row[colIndex['Credit']]) || 0
                                    });
                                }
                            });
                            result.subjectGroups = groupedSubjects;
                            break;
                        case 'ROOMS':
                            // Remove duplicate rooms
                            const uniqueRooms = new Map();
                            jsonData.slice(1)
                                .filter(row => row[colIndex['Room']])
                                .forEach(row => {
                                    const roomName = row[colIndex['Room']];
                                    uniqueRooms.set(roomName, {
                                        name: roomName,
                                        day: row[colIndex['Day']],
                                        timeSlot: row[colIndex['Time Slot']],
                                        maxCapacity: parseInt(row[colIndex['Max Capacity']]) || 0
                                    });
                                });
                            result.rooms = Array.from(uniqueRooms.values());
                            break;
                    }
                });
                
                // Also process PROFSCHED sheet if available
                const profSchedSheet = workbook.Sheets['PROF_ASSIGN'];
                if (profSchedSheet) {
                    const profSchedData = XLSX.utils.sheet_to_json(profSchedSheet, {
                        header: 1,
                        blankrows: false
                    });
                    // Remove empty cells and duplicate entries
                    const uniqueProfSched = new Set(
                        profSchedData.slice(1)
                            .filter(row => row.some(cell => cell)) // Skip empty rows
                            .map(row => row.filter(cell => cell).join('|')) // Convert row to string
                    );
                    result.profSched = Array.from(uniqueProfSched).map(row => row.split('|'));
                }
                
                // Log the counts
                console.log('Data Counts:', {
                    instructors: result.instructors.length,
                    sections: result.sections.length,
                    subjects: result.subjectGroups ? Object.keys(result.subjectGroups).length : 0,
                    rooms: result.rooms.length,
                    profSched: result.profSched ? result.profSched.length : 0
                });
                
                resolve(result);
                
            } catch (error) {
                console.error('Error reading Excel file:', error);
                reject(new Error(error.message));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error reading the file. Please try again.'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

// Process Excel data into our data structures
function processExcelData(data) {
    try {
        // Process instructors (already grouped by professor with multiple specializations)
        instructors = data.instructors;
        console.log('Processed Instructors:', instructors);

        // Process sections
        sections = data.sections;
        console.log('Processed Sections:', sections);

        // Process subjects (grouped by course/year/sem)
        window.subjectGroups = data.subjectGroups || {};
        courses = [];
        console.log('Processed Subject Groups:', window.subjectGroups);

        // Process rooms
        rooms = data.rooms.map(room => ({
            name: room.name,
            capacity: room.maxCapacity,
                availability: {
                days: room.day.split('-').map(d => d.trim()),
                time: room.timeSlot
            }
        }));
        console.log('Processed Rooms:', rooms);

        // Process professor schedules if available
        if (data.profSched) {
            // Store professor schedules for conflict checking
            window.profSchedules = data.profSched;
            console.log('Processed Professor Schedules:', window.profSchedules);
        }

        if (data.profAssignment) {
            window.profAssignment = data.profAssignment;
            console.log('Processed Professor Assignment:', window.profAssignment);
        }

        // Call resource estimation after subject groups are loaded
        estimateResourceNeeds();

    } catch (error) {
        console.error('Error processing Excel data:', error);
        throw new Error('Failed to process Excel data. Please check the file format.');
    }
}

// Generate schedule using constraint-based algorithm
function generateSchedule() {
    const schedule = [];
    const timeSlots = generateTimeSlots();
    
    // Sort sections by student count (descending) to handle larger classes first
    const sortedSections = [...sections].sort((a, b) => b.students - a.students);
    
    for (const section of sortedSections) {
        const sectionSubjects = getSubjectsForSection(section);
        
        for (const subject of sectionSubjects) {
            const assignment = findBestAssignment(subject, section, timeSlots);
            if (assignment) {
                schedule.push(assignment);
                markTimeSlotAsUsed(timeSlots, assignment);
            }
        }
    }
    
    return schedule;
}

// Generate available time slots
function generateTimeSlots() {
    const timeSlots = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const times = ['7:00 am - 8:30 am', '8:30 am - 10:00 am', '10:00 am - 11:30 am', 
                  '1:00 pm - 2:30 pm', '2:30 pm - 4:00 pm', '4:00 pm - 5:30 pm',
                  '5:30 pm - 7:00 pm'];
    
    for (const day of days) {
        for (const time of times) {
            timeSlots.push({
                day,
                time,
                available: true,
                room: null,
                instructor: null
            });
        }
    }
    
    return timeSlots;
}

// Find the best assignment for a subject
function findBestAssignment(subject, section, timeSlots) {
    const availableInstructors = findAvailableInstructors(subject);
    const suitableRooms = findSuitableRooms(section.students, subject);
    
    // Strict enforcement for PATHFit
    if (subject && subject.code) {
        const code = subject.code.replace(/\s+/g, '').toUpperCase();
        if ((code === 'PATHFIT112' || code === 'PATHFIT212') && suitableRooms.length === 0) {
            // No gym room available, do not schedule
            return null;
        }
    }
    
    for (const slot of timeSlots) {
        if (!slot.available) continue;
        
        for (const instructor of availableInstructors) {
            for (const room of suitableRooms) {
                if (isValidAssignment(slot, instructor, room, section)) {
                    return {
                        subject: subject.code,
                        section: section.section,
                        instructor: instructor.name,
                        room: room.name,
                        day: slot.day,
                        time: slot.time
                    };
                }
            }
        }
    }
    
    return null;
}

// Find available instructors for a subject
function findAvailableInstructors(subject) {
    return instructors.filter(instructor => {
        return instructor.specializations.some(specRaw => {
            const spec = specRaw.trim().toLowerCase();
            // Find the map key that matches this spec (case-insensitive, trimmed)
            const mapKey = Object.keys(specializationSubjectMap).find(key => key.trim().toLowerCase() === spec);
            const map = mapKey ? specializationSubjectMap[mapKey] : undefined;
            if (map) {
                const match = map.some(keyword =>
                    (subject.title && subject.title.toLowerCase().includes(keyword.toLowerCase())) ||
                    (subject.code && subject.code.toLowerCase().includes(keyword.toLowerCase()))
                );
                if (match) {
                    console.log(`[MATCH] Instructor: ${instructor.name}, Spec: ${specRaw}, Subject: ${subject.title} (${subject.code})`);
                } else {
                    console.log(`[NO MATCH] Instructor: ${instructor.name}, Spec: ${specRaw}, Subject: ${subject.title} (${subject.code})`);
                }
                return match;
            } else {
                // Fallback: check if spec is in subject title/code
                const fallbackMatch = (subject.title && subject.title.toLowerCase().includes(spec)) ||
                                     (subject.code && subject.code.toLowerCase().includes(spec));
                if (fallbackMatch) {
                    console.log(`[FALLBACK MATCH] Instructor: ${instructor.name}, Spec: ${specRaw}, Subject: ${subject.title} (${subject.code})`);
                } else {
                    console.log(`[NO FALLBACK MATCH] Instructor: ${instructor.name}, Spec: ${specRaw}, Subject: ${subject.title} (${subject.code})`);
                }
                return fallbackMatch;
            }
        });
    });
}

// Find suitable rooms based on class size and subject
function findSuitableRooms(studentCount, subject) {
    if (subject && subject.code) {
        const code = subject.code.replace(/\s+/g, '').toUpperCase();
        // Match any PATHFIT subject
        if (code.startsWith('PATHFIT')) {
            const gymRooms = rooms.filter(room => room.name.toUpperCase().includes('GYM'));
            console.log('[DEBUG] PATHFit subject, available gym rooms:', gymRooms.map(r => r.name));
            return gymRooms;
        }
    }
    return rooms.filter(room => room.capacity >= studentCount);
}

// Check if an assignment is valid
function isValidAssignment(slot, instructor, room, section, day, slots) {
    // No overlapping assignments for instructor, room, or section
    for (const s of slots) {
        if (
            (teacherAssignments[instructor.name] && teacherAssignments[instructor.name][day] && teacherAssignments[instructor.name][day][s]) ||
            (roomAssignments[room.name] && roomAssignments[room.name][day] && roomAssignments[room.name][day][s]) ||
            (sectionAssignments[section] && sectionAssignments[section][day] && sectionAssignments[section][day][s])
        ) {
            return false;
        }
    }
    // Instructor availability
    if (instructor.availability && instructor.availability.days && !instructor.availability.days.includes(day)) return false;
    if (instructor.availability && instructor.availability.time) {
        const [start, end] = instructor.availability.time.split(' - ');
        const slotStart = slots[0].split(' - ')[0];
        if (!isTimeInRange(slotStart, instructor.availability.time)) return false;
    }
    // Room capacity
    if (room.capacity < section.students) return false;
    return true;
}

// Check for scheduling conflicts
function hasConflict(slot, instructor, room, section) {
    return schedules.some(schedule => 
        schedule.day === slot.day &&
        schedule.time === slot.time &&
        (schedule.instructor === instructor.name ||
         schedule.room === room.name ||
         schedule.section === section.section)
    );
}

// Mark time slot as used
function markTimeSlotAsUsed(timeSlots, assignment) {
    const slot = timeSlots.find(s => 
        s.day === assignment.day && 
        s.time === assignment.time
    );
    if (slot) {
        slot.available = false;
        slot.room = assignment.room;
        slot.instructor = assignment.instructor;
    }
}

// Display schedule results
function displayScheduleResults(schedule) {
    const generationResults = document.getElementById('generation-results');
    
    if (schedule.length === 0) {
        generationResults.innerHTML = `
            <div class="error-message">
                Unable to generate a complete schedule. Please check constraints and try again.
            </div>
        `;
        return;
    }
    
    const scheduleHtml = `
        <div class="success-message">
            Schedule generated successfully!
        </div>
        <div class="timetable-container">
            <table class="teachers-table">
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Section</th>
                        <th>Instructor</th>
                        <th>Room</th>
                        <th>Day</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${schedule.map(entry => `
                        <tr>
                            <td>${entry.subject}</td>
                            <td>${entry.section}</td>
                            <td>${entry.instructor}</td>
                            <td>${entry.room}</td>
                            <td>${entry.day}</td>
                            <td>${entry.time}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    generationResults.innerHTML = scheduleHtml;
}

// Navigation view handlers
function showDashboard() {
    const mainContent = document.getElementById('main-content');
    
    // Count unique values
    const uniqueTeachers = instructors ? instructors.length : 0;
    const uniqueCourses = [...new Set(sections.map(section => section.course))].length;
    const uniqueRooms = [...new Set(rooms.map(room => room.name))].length;
    const activeSchedules = window.profSchedules ? window.profSchedules.length : 0;

    const html = `
        <div class="dashboard-title">Dashboard</div>
        <div class="dashboard-cards">
            <div class="dashboard-card">
                <span class="card-icon">
                    <i class="fas fa-users" style="color:#6c63ff;font-size:2.5em;"></i>
                </span>
                <div class="card-number">${uniqueTeachers}</div>
                <div class="card-label">Total Teachers</div>
            </div>
            <div class="dashboard-card">
                <span class="card-icon">
                    <i class="fas fa-book" style="color:#6c63ff;font-size:2.5em;"></i>
                </span>
                <div class="card-number">${uniqueCourses}</div>
                <div class="card-label">Total Courses</div>
            </div>
            <div class="dashboard-card">
                <span class="card-icon">
                    <i class="fas fa-door-open" style="color:#6c63ff;font-size:2.5em;"></i>
                </span>
                <div class="card-number">${uniqueRooms}</div>
                <div class="card-label">Available Rooms</div>
            </div>
            <div class="dashboard-card">
                <span class="card-icon">
                    <i class="fas fa-calendar-check" style="color:#6c63ff;font-size:2.5em;"></i>
                </span>
                <div class="card-number">${activeSchedules}</div>
                <div class="card-label">Active Schedules</div>
            </div>
        </div>
        <div class="dashboard-title" style="font-size:1.3em;margin-bottom:18px;margin-top:8px;">Quick Actions</div>
        <div class="dashboard-cards quick-actions">
            <button class="dashboard-quick-btn" data-link="teachers-link">
                <span class="card-icon">
                    <i class="fas fa-users" style="color:#fff;font-size:1.5em;"></i>
                </span>
                <span class="card-label">Manage Teachers</span>
            </button>
            <button class="dashboard-quick-btn" data-link="students-link">
                <span class="card-icon">
                    <i class="fas fa-user-graduate" style="color:#fff;font-size:1.5em;"></i>
                </span>
                <span class="card-label">Manage Students</span>
            </button>
            <button class="dashboard-quick-btn" data-link="rooms-link">
                <span class="card-icon">
                    <i class="fas fa-door-open" style="color:#fff;font-size:1.5em;"></i>
                </span>
                <span class="card-label">Manage Rooms</span>
            </button>
            <button class="dashboard-quick-btn" data-link="courses-link">
                <span class="card-icon">
                    <i class="fas fa-book" style="color:#fff;font-size:1.5em;"></i>
                </span>
                <span class="card-label">Manage Courses</span>
            </button>
        </div>
    `;
    
    mainContent.innerHTML = html;

    // Add event listeners for quick action buttons
    document.querySelectorAll('.dashboard-quick-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const linkId = this.getAttribute('data-link');
            const sidebarLink = document.getElementById(linkId);
            if (sidebarLink) {
                sidebarLink.click();
            }
        });
    });

    animateMainContent();
}

function animateMainContent() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.classList.remove('fadeInUp');
        void mainContent.offsetWidth; // Force reflow
        mainContent.classList.add('fadeInUp');
    }
}

function showScheduler() {
    const mainContent = document.getElementById('main-content');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const times = [
        '7:00 am - 7:30 am', '7:30 am - 8:00 am', '8:00 am - 8:30 am',
        '8:30 am - 9:00 am', '9:00 am - 9:30 am', '9:30 am - 10:00 am',
        '10:00 am - 10:30 am', '10:30 am - 11:00 am', '11:00 am - 11:30 am',
        '11:30 am - 12:00 pm', '12:00 pm - 12:30 pm', '12:30 pm - 1:00 pm',
        '1:00 pm - 1:30 pm', '1:30 pm - 2:00 pm', '2:00 pm - 2:30 pm',
        '2:30 pm - 3:00 pm', '3:00 pm - 3:30 pm', '3:30 pm - 4:00 pm',
        '4:00 pm - 4:30 pm', '4:30 pm - 5:00 pm', '5:00 pm - 5:30 pm',
        '5:30 pm - 6:00 pm', '6:00 pm - 6:30 pm', '6:30 pm - 7:00 pm',
    ];
    if (!window.generatedSectionSchedule) generateSectionBasedSchedule();
    const schedule = window.generatedSectionSchedule || [];
    // Use all sections from the sections array for the dropdown
    const allSections = sections.map(s => s.section);
    let selectedSection = allSections[0];
    if (window.selectedSchedulerSection && allSections.includes(window.selectedSchedulerSection)) {
        selectedSection = window.selectedSchedulerSection;
    }
    let html = `
        <div class="scheduler-container">
            <h2>View/Edit Scheduler</h2>
            <div style="margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <label for="section-sched-select"><strong>Section:</strong></label>
                    <select id="section-sched-select">
                        ${allSections.map(sec => `<option value="${sec}"${sec === selectedSection ? ' selected' : ''}>${sec}</option>`).join('')}
                    </select>
                </div>
                <div class="scheduler-actions">
                    <button id="add-schedule-btn" class="primary-btn" style="padding: 12px 24px;">
                        <i class="fas fa-plus"></i> Add Schedule
                    </button>
                    <div class="export-dropdown">
                        <button id="export-btn" class="secondary-btn" style="padding: 12px 24px;">
                            <i class="fas fa-download"></i> Export
                        </button>
                        <div class="export-options">
                            <button onclick="exportAsImage()" class="export-option">
                                <i class="fas fa-image"></i> Save as Image
                            </button>
                            <button onclick="exportAsPDF()" class="export-option">
                                <i class="fas fa-file-pdf"></i> Save as PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="timetable-container" id="timetable-container">
                <table class="timetable">
                    <thead>
                        <tr>
                            <th>Time</th>
                            ${days.map(day => `<th>${day}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${(() => {
                            const rowspanTracker = {};
                            days.forEach(day => { rowspanTracker[day] = 0; });
                            let rows = [];
                            times.forEach((time, timeIdx) => {
                                let rowHtml = `<tr><td>${time}</td>`;
                                days.forEach(day => {
                                    if (rowspanTracker[day] > 0) {
                                        rowspanTracker[day]--;
                                        return;
                                    }
                                    const entries = schedule.filter(s =>
                                        s.section === selectedSection &&
                                        s.day === day &&
                                        s.slots.includes(time)
                                    );
                                    if (entries.length > 0) {
                                        entries.forEach((entry, idx) => {
                                            const isFirstSlot = entry.slots[0] === time;
                                            if (isFirstSlot) {
                                                let rowspan = entry.slots.length;
                                                if (timeIdx + rowspan > times.length) {
                                                    rowspan = times.length - timeIdx;
                                                }
                                                rowspanTracker[day] = rowspan - 1;
                                                rowHtml += `<td rowspan="${rowspan}" style="background:${entry.color};color:#fff;vertical-align:middle;text-align:center;min-width:120px;">
                                                    <div style="font-weight:700;font-size:1.1em;">${entry.subject}</div>
                                                    <div style="font-size:0.95em;">${entry.subjectCode}</div>
                                                    <div style="font-size:0.95em;">${entry.instructor}</div>
                                                    <div style="font-size:0.95em;">${entry.room}</div>
                                                </td>`;
                                            }
                                        });
                                    } else {
                                        rowHtml += '<td></td>';
                                    }
                                });
                                rowHtml += '</tr>';
                                rows.push(rowHtml);
                            });
                            let footerRow = '<tr><td style="height:0;padding:0;border-top:0;"></td>';
                            days.forEach(() => {
                                footerRow += '<td style="height:0;padding:0;border-top:0;"></td>';
                            });
                            footerRow += '</tr>';
                            return rows.join('') + footerRow;
                        })()}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Add Schedule Modal -->
        <div id="add-schedule-modal" class="modal" style="display:none;">
            <div class="modal-content" style="max-width:500px;">
                <h3>Add New Schedule</h3>
                <form id="add-schedule-form">
                    <div class="form-group">
                        <label for="subject-code">Subject Code:</label>
                        <input type="text" id="subject-code" required>
                    </div>
                    <div class="form-group">
                        <label for="subject-title">Subject Title:</label>
                        <input type="text" id="subject-title" required>
                    </div>
                    <div class="form-group">
                        <label for="instructor-select">Instructor:</label>
                        <select id="instructor-select" required>
                            ${instructors.map(inst => `<option value="${inst.name}">${inst.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="room-select">Room:</label>
                        <select id="room-select" required>
                            ${rooms.map(room => `<option value="${room.name}">${room.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="day-select">Day:</label>
                        <select id="day-select" required>
                            ${days.map(day => `<option value="${day}">${day}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="time-select">Time Slot:</label>
                        <select id="time-select" required>
                            ${times.map(time => `<option value="${time}">${time}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="duration">Duration (in 30-min slots):</label>
                        <select id="duration" required>
                            <option value="1">30 minutes</option>
                            <option value="2">1 hour</option>
                            <option value="3">1.5 hours</option>
                            <option value="4">2 hours</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="primary-btn">Add Schedule</button>
                        <button type="button" class="secondary-btn" onclick="document.getElementById('add-schedule-modal').style.display='none'">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    mainContent.innerHTML = html;

    // Add event listeners
    const select = document.getElementById('section-sched-select');
    if (select) {
        select.addEventListener('change', function() {
            window.selectedSchedulerSection = this.value;
            showScheduler();
        });
    }

    // Add schedule button click handler
    const addScheduleBtn = document.getElementById('add-schedule-btn');
    if (addScheduleBtn) {
        addScheduleBtn.addEventListener('click', function() {
            document.getElementById('add-schedule-modal').style.display = 'block';
        });
    }

    // Export button click handler
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const options = document.querySelector('.export-options');
            options.style.display = options.style.display === 'block' ? 'none' : 'block';
        });
    }

    // Close export options when clicking outside
    document.addEventListener('click', function(e) {
        const options = document.querySelector('.export-options');
        const exportBtn = document.getElementById('export-btn');
        if (options && !exportBtn.contains(e.target) && !options.contains(e.target)) {
            options.style.display = 'none';
        }
    });

    // Add schedule form submit handler
    const addScheduleForm = document.getElementById('add-schedule-form');
    if (addScheduleForm) {
        addScheduleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const subjectCode = document.getElementById('subject-code').value;
            const subjectTitle = document.getElementById('subject-title').value;
            const instructor = document.getElementById('instructor-select').value;
            const room = document.getElementById('room-select').value;
            const day = document.getElementById('day-select').value;
            const timeSlot = document.getElementById('time-select').value;
            const duration = parseInt(document.getElementById('duration').value);

            // Get the time slots based on duration
            const timeIndex = times.indexOf(timeSlot);
            const slots = times.slice(timeIndex, timeIndex + duration);

            // Create new schedule entry
            const newSchedule = {
                section: selectedSection,
                subject: subjectTitle,
                subjectCode: subjectCode,
                instructor: instructor,
                room: room,
                day: day,
                slots: slots,
                color: getRandomColor()
            };

            // Add to existing schedule
            if (!window.generatedSectionSchedule) {
                window.generatedSectionSchedule = [];
            }
            window.generatedSectionSchedule.push(newSchedule);

            // Close modal and refresh view
            document.getElementById('add-schedule-modal').style.display = 'none';
            showScheduler();
        });
    }

    animateMainContent();
}

// Export functions
async function exportAsImage() {
    const timetableContainer = document.getElementById('timetable-container');
    const section = document.getElementById('section-sched-select').value;
    
    try {
        const canvas = await html2canvas(timetableContainer, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        const link = document.createElement('a');
        link.download = `timetable-${section}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error('Error exporting as image:', error);
        alert('Failed to export timetable as image. Please try again.');
    }
}

async function exportAsPDF() {
    const timetableContainer = document.getElementById('timetable-container');
    const section = document.getElementById('section-sched-select').value;
    
    try {
        const canvas = await html2canvas(timetableContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({
            orientation: 'landscape',
            unit: 'mm'
        });
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`timetable-${section}.pdf`);
    } catch (error) {
        console.error('Error exporting as PDF:', error);
        alert('Failed to export timetable as PDF. Please try again.');
    }
}

// ... rest of the existing code ...

function showTeachers() {
    const mainContent = document.getElementById('main-content');
    // Process teachers data to include their specializations
    const teachersWithSubjects = instructors.map(teacher => {
        return {
            name: teacher.name,
            specializations: teacher.specializations || [],
            day: teacher.day || 'Monday - Friday',
            time: teacher.time || '7:00 am - 7:00 pm'
        };
    });

    let html = `
        <div class="teachers-container">
            <h2>Manage Teachers</h2>
            <div class="teacher-search-bar">
                <input type="text" id="teacher-search" placeholder="Search instructor by name...">
                <button id="teacher-search-btn"><i class="fas fa-search"></i></button>
            </div>
            <div class="teachers-list">
                <table class="data-table" id="teachers-table">
                    <thead>
                        <tr>
                            <th>NAME</th>
                            <th>SPECIALIZATIONS</th>
                            <th>AVAILABLE DAYS</th>
                            <th>AVAILABLE TIME</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody id="teachers-table-body">
                        ${teachersWithSubjects.map(teacher => `
                            <tr>
                                <td>${teacher.name || ''}</td>
                                <td>${teacher.specializations.length > 0 ? 
                                    teacher.specializations.join(', ') : 
                                    '<span class="no-spec">No specializations</span>'}</td>
                                <td>${teacher.day !== 'Day' ? teacher.day : 'Monday - Friday'}</td>
                                <td>${teacher.time !== 'Time' ? teacher.time : '7:00 am - 7:00 pm'}</td>
                                <td>
                                    <button class="view-btn" onclick="viewTeacherSchedule('${teacher.name}')">View Schedule</button>
                                    <button class="edit-btn">Edit</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    mainContent.innerHTML = html;

    // Search functionality
    const searchInput = document.getElementById('teacher-search');
    const searchBtn = document.getElementById('teacher-search-btn');
    const tableBody = document.getElementById('teachers-table-body');
    function filterTeachers() {
        const query = searchInput.value.trim().toLowerCase();
        tableBody.innerHTML = teachersWithSubjects
            .filter(teacher => teacher.name.toLowerCase().includes(query))
            .map(teacher => `
                <tr>
                    <td>${teacher.name || ''}</td>
                    <td>${teacher.specializations.length > 0 ? 
                        teacher.specializations.join(', ') : 
                        '<span class="no-spec">No specializations</span>'}</td>
                    <td>${teacher.day !== 'Day' ? teacher.day : 'Monday - Friday'}</td>
                    <td>${teacher.time !== 'Time' ? teacher.time : '7:00 am - 7:00 pm'}</td>
                    <td>
                        <button class="view-btn" onclick="viewTeacherSchedule('${teacher.name}')">View Schedule</button>
                        <button class="edit-btn">Edit</button>
                    </td>
                </tr>
            `).join('');
    }
    searchBtn.addEventListener('click', filterTeachers);
    searchInput.addEventListener('input', filterTeachers);

    animateMainContent();
}

// Function to view teacher's schedule
function viewTeacherSchedule(teacherName) {
    // Get all entries from PROFSCHED for this teacher
    const teacherSchedule = window.profSchedules ? 
        window.profSchedules.filter(row => 
            row.some(cell => cell && cell.includes(teacherName + ':'))
        ).map(row => {
            const teacherCell = row.find(cell => cell && cell.includes(teacherName + ':'));
            const subjectCode = teacherCell ? teacherCell.split(':')[1].trim() : '';
            return {
                subject: subjectCode,
                section: row[0] || '' // First column is usually the section
            };
        }) : [];
    
    const scheduleHtml = `
        <div class="modal">
            <div class="modal-content">
                <h3>${teacherName}'s Schedule</h3>
                <table class="schedule-table">
                    <thead>
                        <tr>
                            <th>Subject Code</th>
                            <th>Section</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teacherSchedule.map(schedule => `
                            <tr>
                                <td>${schedule.subject}</td>
                                <td>${schedule.section}</td>
                            </tr>
                        `).join('')}
                        ${teacherSchedule.length === 0 ? `
                            <tr>
                                <td colspan="2" style="text-align: center;">No scheduled subjects</td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
                <button class="close-btn" onclick="this.closest('.modal').remove()">Close</button>
            </div>
        </div>
    `;
    mainContent.innerHTML = scheduleHtml;

    animateMainContent();
}

function showStudents() {
    const mainContent = document.getElementById('main-content');
    let html = `
        <div class="students-container">
            <h2>Manage Students</h2>
            <div class="student-search-bar">
                <input type="text" id="student-search" placeholder="Search by course, year, or section...">
                <button id="student-search-btn"><i class="fas fa-search"></i></button>
            </div>
            <div class="students-list">
                <table class="data-table" id="students-table">
                    <thead>
                        <tr>
                            <th>Course</th>
                            <th>Year Level</th>
                            <th>Section</th>
                            <th>Number of Students</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="students-table-body">
                        ${sections.map(section => `
                            <tr>
                                <td>${section.course}</td>
                                <td>${section.yearLevel}</td>
                                <td>${section.section}</td>
                                <td>${section.students}</td>
                                <td>
                                    <button class="edit-btn">Edit</button>
                                    <button class="delete-btn">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <button class="add-btn">Add New Section</button>
        </div>
    `;
    mainContent.innerHTML = html;

    // Search functionality
    const searchInput = document.getElementById('student-search');
    const searchBtn = document.getElementById('student-search-btn');
    const tableBody = document.getElementById('students-table-body');
    function filterStudents() {
        const query = searchInput.value.trim().toLowerCase();
        tableBody.innerHTML = sections
            .filter(section =>
                section.course.toLowerCase().includes(query) ||
                section.yearLevel.toString().toLowerCase().includes(query) ||
                section.section.toLowerCase().includes(query)
            )
            .map(section => `
                <tr>
                    <td>${section.course}</td>
                    <td>${section.yearLevel}</td>
                    <td>${section.section}</td>
                    <td>${section.students}</td>
                    <td>
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                    </td>
                </tr>
            `).join('');
    }
    searchBtn.addEventListener('click', filterStudents);
    searchInput.addEventListener('input', filterStudents);

    animateMainContent();
}

function showRooms() {
    const mainContent = document.getElementById('main-content');
    let html = `
        <div class="rooms-container">
            <h2>Manage Rooms</h2>
            <div class="room-search-bar">
                <input type="text" id="room-search" placeholder="Search by room name...">
                <button id="room-search-btn"><i class="fas fa-search"></i></button>
            </div>
            <div class="rooms-list">
                <table class="data-table" id="rooms-table">
                    <thead>
                        <tr>
                            <th>Room Name</th>
                            <th>Capacity</th>
                            <th>Available Days</th>
                            <th>Available Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="rooms-table-body">
                        ${rooms.map(room => `
                            <tr>
                                <td>${room.name}</td>
                                <td>${room.capacity}</td>
                                <td>${room.availability.days.join(', ')}</td>
                                <td>${room.availability.time}</td>
                                <td>
                                    <button class="edit-btn">Edit</button>
                                    <button class="delete-btn">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <button class="add-btn">Add New Room</button>
        </div>
    `;
    mainContent.innerHTML = html;

    // Search functionality
    const searchInput = document.getElementById('room-search');
    const searchBtn = document.getElementById('room-search-btn');
    const tableBody = document.getElementById('rooms-table-body');
    function filterRooms() {
        const query = searchInput.value.trim().toLowerCase();
        tableBody.innerHTML = rooms
            .filter(room => room.name.toLowerCase().includes(query))
            .map(room => `
                <tr>
                    <td>${room.name}</td>
                    <td>${room.capacity}</td>
                    <td>${room.availability.days.join(', ')}</td>
                    <td>${room.availability.time}</td>
                    <td>
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                    </td>
                </tr>
            `).join('');
    }
    searchBtn.addEventListener('click', filterRooms);
    searchInput.addEventListener('input', filterRooms);

    animateMainContent();
}

function showCourses() {
    const mainContent = document.getElementById('main-content');
    const subjectGroups = window.subjectGroups || {};
    // Map course code to Font Awesome icon
    const courseIconMap = {
        'BSA': 'fa-calculator',
        'BSAIS': 'fa-laptop-code',
        'BS Marketing': 'fa-chart-bar',
        'BSE': 'fa-lightbulb',
        'BS Public Administration': 'fa-bullhorn',
        
        // Add more mappings as needed
    };
    // Helper to normalize course code (uppercase, no spaces)
    function normalizeCourseCode(code) {
        return code ? code.toUpperCase().replace(/\s+/g, '') : '';
    }
    // Extract all course codes and map to their prettiest label
    const courseLabelMap = {};
    Object.keys(subjectGroups).forEach(key => {
        const match = key.match(/\(([^)]+)\)$/);
        if (match) {
            const raw = match[1].trim();
            const norm = normalizeCourseCode(raw);
            // Prefer the first encountered label for prettiness
            if (!courseLabelMap[norm]) courseLabelMap[norm] = raw;
        }
    });
    const uniqueCourses = Object.keys(courseLabelMap);
    // Helper to get icon for course
    function getCourseIcon(courseNorm) {
        // Try to use the normalized code, fallback to prettiest label
        return courseIconMap[courseLabelMap[courseNorm].toUpperCase()] || courseIconMap[courseNorm] || 'fa-book';
    }
    // Helper to get all year/sem group keys for a course
    function getYearSemGroupsForCourse(courseNorm) {
        return Object.keys(subjectGroups)
            .filter(key => {
                const match = key.match(/\(([^)]+)\)$/);
                return match && normalizeCourseCode(match[1]) === courseNorm;
            });
    }
    // Helper to get year/sem label from group key
    function getYearSemLabel(key, courseNorm) {
        // Remove the course code in parentheses from the end
        const pretty = courseLabelMap[courseNorm];
        return key.replace(new RegExp('\\s*\\(' + pretty.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\)\\s*$'), '').trim();
    }
    // Render course cards (only unique normalized course codes)
    function renderCourseCards() {
        mainContent.innerHTML = `
            <div class="dashboard-title">Manage Courses</div>
            <div class="courses-card-grid">
                ${uniqueCourses.map(courseNorm => `
                    <div class="course-card" data-course-norm="${courseNorm}">
                        <span class="course-icon"><i class="fas ${getCourseIcon(courseNorm)}"></i></span>
                        <div class="course-title">${courseLabelMap[courseNorm]}</div>
                    </div>
                `).join('')}
            </div>
        `;
        // Add click handlers
        document.querySelectorAll('.course-card').forEach(card => {
            card.addEventListener('click', function() {
                const courseNorm = this.getAttribute('data-course-norm');
                renderYearSemDropdown(courseNorm);
            });
        });
    }
    // Render year/sem dropdown and subjects for a selected course
    function renderYearSemDropdown(courseNorm) {
        const yearSemGroups = getYearSemGroupsForCourse(courseNorm);
        if (yearSemGroups.length === 0) {
            mainContent.innerHTML = `<button class="back-btn"><i class="fas fa-arrow-left"></i> Back</button><div class="subjects-list-container"><div>No subjects found for this course.</div></div>`;
            document.querySelector('.back-btn').addEventListener('click', renderCourseCards);
            return;
        }
        let selectedGroup = yearSemGroups[0];
        function renderSubjectsTable(groupKey) {
            const subjects = subjectGroups[groupKey] || [];
            return `
                <table class="subjects-table">
                    <thead>
                        <tr>
                            <th>Subject Code</th>
                            <th>Subject Name</th>
                            <th>Units</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subjects.map(subject => `
                            <tr>
                                <td>${subject.code}</td>
                                <td>${subject.title}</td>
                                <td>${subject.credit}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        mainContent.innerHTML = `
            <button class="back-btn"><i class="fas fa-arrow-left"></i> Back</button>
            <div class="subjects-list-container">
                <div class="subjects-list-header">
                    <h3>${selectedGroup} Subjects</h3>
                    <select id="year-sem-select">
                        ${yearSemGroups.map(key => `<option value="${key}">${getYearSemLabel(key, courseNorm)}</option>`).join('')}
                    </select>
                </div>
                <div id="subjects-table-wrapper">
                    ${renderSubjectsTable(selectedGroup)}
                </div>
            </div>
        `;
        document.querySelector('.back-btn').addEventListener('click', renderCourseCards);
        document.getElementById('year-sem-select').addEventListener('change', function() {
            selectedGroup = this.value;
            document.querySelector('.subjects-list-header h3').textContent = selectedGroup + ' Subjects';
            document.getElementById('subjects-table-wrapper').innerHTML = renderSubjectsTable(selectedGroup);
        });
    }
    renderCourseCards();
}

function showAutoGenerate() {
    setupFileUpload();
    animateMainContent();
}

function showInstructorSchedule() {
    const mainContent = document.getElementById('main-content');
    const times = [
        '7:00 am - 7:30 am',
        '7:30 am - 8:00 am',
        '8:00 am - 8:30 am',
        '8:30 am - 9:00 am',
        '9:00 am - 9:30 am',
        '9:30 am - 10:00 am',
        '10:00 am - 10:30 am',
        '10:30 am - 11:00 am',
        '11:00 am - 11:30 am',
        '11:30 am - 12:00 pm',
        '12:00 pm - 12:30 pm',
        '12:30 pm - 1:00 pm',
        '1:00 pm - 1:30 pm',
        '1:30 pm - 2:00 pm',
        '2:00 pm - 2:30 pm',
        '2:30 pm - 3:00 pm',
        '3:00 pm - 3:30 pm',
        '3:30 pm - 4:00 pm',
        '4:00 pm - 4:30 pm',
        '4:30 pm - 5:00 pm',
        '5:00 pm - 5:30 pm',
        '5:30 pm - 6:00 pm',
        '6:00 pm - 6:30 pm',
        '6:30 pm - 7:00 pm',
        
    ];
    
    const html = `
        <div class="instructor-schedule-container">
            <h2>Instructor Schedules</h2>
            <div class="instructor-select">
                <label for="instructor-select">Select Instructor:</label>
                <select id="instructor-select">
                    ${instructors.map(instructor => `
                        <option value="${instructor.name}">${instructor.name}</option>
                    `).join('')}
                </select>
            </div>
            <div class="scheduler-actions" style="margin-bottom:18px;display:flex;gap:12px;align-items:center;"></div>
            <div class="timetable-container" id="instructor-timetable-container">
                <table class="timetable">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Monday</th>
                            <th>Tuesday</th>
                            <th>Wednesday</th>
                            <th>Thursday</th>
                            <th>Friday</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${times.map(time => `
                            <tr>
                                <td>${time}</td>
                                <td id="monday-${time.replace(/[:\s]/g, '')}-instructor"></td>
                                <td id="tuesday-${time.replace(/[:\s]/g, '')}-instructor"></td>
                                <td id="wednesday-${time.replace(/[:\s]/g, '')}-instructor"></td>
                                <td id="thursday-${time.replace(/[:\s]/g, '')}-instructor"></td>
                                <td id="friday-${time.replace(/[:\s]/g, '')}-instructor"></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    mainContent.innerHTML = html;
    
    // Add event listener for instructor selection
    const instructorSelect = document.getElementById('instructor-select');
    if (instructorSelect) {
        instructorSelect.addEventListener('change', function() {
            const selectedInstructor = this.value;
            populateInstructorSchedule(selectedInstructor);
        });
        
        // Load initial instructor schedule
        if (instructors.length > 0) {
            populateInstructorSchedule(instructors[0].name);
        }
    }

    animateMainContent();
    addInstructorScheduleModal();
    setupInstructorScheduleActions();
}

// --- Instructor Schedule Manual Add & Export Features ---
// Add modal HTML for manual instructor schedule entry
function addInstructorScheduleModal() {
    if (document.getElementById('add-instructor-schedule-modal')) return;
    const modalHtml = `
        <div id="add-instructor-schedule-modal" class="modal" style="display:none;">
            <div class="modal-content" style="max-width:500px;">
                <h3>Add New Instructor Schedule</h3>
                <form id="add-instructor-schedule-form">
                    <div class="form-group">
                        <label for="instructor-manual-section">Section:</label>
                        <input type="text" id="instructor-manual-section" required>
                    </div>
                    <div class="form-group">
                        <label for="instructor-manual-subject">Subject:</label>
                        <input type="text" id="instructor-manual-subject" required>
                    </div>
                    <div class="form-group">
                        <label for="instructor-manual-building">Building:</label>
                        <input type="text" id="instructor-manual-building" required>
                    </div>
                    <div class="form-group">
                        <label for="instructor-manual-room">Room:</label>
                        <input type="text" id="instructor-manual-room" required>
                    </div>
                    <div class="form-group">
                        <label for="instructor-manual-day">Day:</label>
                        <select id="instructor-manual-day" required>
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Wednesday">Wednesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="Friday">Friday</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="instructor-manual-time">Time Slot:</label>
                        <select id="instructor-manual-time" required>
                            ${[
                                '7:00 am - 7:30 am','7:30 am - 8:00 am','8:00 am - 8:30 am','8:30 am - 9:00 am','9:00 am - 9:30 am','9:30 am - 10:00 am','10:00 am - 10:30 am','10:30 am - 11:00 am','11:00 am - 11:30 am','11:30 am - 12:00 pm','12:00 pm - 12:30 pm','12:30 pm - 1:00 pm','1:00 pm - 1:30 pm','1:30 pm - 2:00 pm','2:00 pm - 2:30 pm','2:30 pm - 3:00 pm','3:00 pm - 3:30 pm','3:30 pm - 4:00 pm','4:00 pm - 4:30 pm','4:30 pm - 5:00 pm','5:00 pm - 5:30 pm','5:30 pm - 6:00 pm','6:00 pm - 6:30 pm','6:30 pm - 7:00 pm'
                            ].map(time => `<option value="${time}">${time}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="instructor-manual-color">Color:</label>
                        <input type="color" id="instructor-manual-color" value="#3498db">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="primary-btn">Add Schedule</button>
                        <button type="button" class="secondary-btn" onclick="document.getElementById('add-instructor-schedule-modal').style.display='none'">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}
// Add event listeners for manual add and export in instructor schedule view
function setupInstructorScheduleActions() {
    const actionsDiv = document.querySelector('.instructor-schedule-container .scheduler-actions');
    if (!actionsDiv) return;

    // Add button for manual add
    if (!document.getElementById('add-instructor-schedule-btn')) {
        const addBtn = document.createElement('button');
        addBtn.id = 'add-instructor-schedule-btn';
        addBtn.className = 'primary-btn';
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Schedule';
        addBtn.onclick = () => {
            document.getElementById('add-instructor-schedule-modal').style.display = 'block';
        };
        actionsDiv.appendChild(addBtn);
    }

    // Add export buttons if not present
    if (!document.getElementById('export-instructor-btn')) {
        const exportDiv = document.createElement('div');
        exportDiv.className = 'export-dropdown';
        exportDiv.innerHTML = `
            <button id="export-instructor-btn" class="secondary-btn">
                <i class="fas fa-download"></i> Export
            </button>
            <div class="export-options">
                <button onclick="exportInstructorAsImage()" class="export-option">
                    <i class="fas fa-image"></i> Save as Image
                </button>
                <button onclick="exportInstructorAsPDF()" class="export-option">
                    <i class="fas fa-file-pdf"></i> Save as PDF
                </button>
            </div>`;
        actionsDiv.appendChild(exportDiv);

        // Add click handler for export button
        const exportBtn = document.getElementById('export-instructor-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const options = this.nextElementSibling;
                options.style.display = options.style.display === 'block' ? 'none' : 'block';
            });
        }

        // Close export options when clicking outside
        document.addEventListener('click', function(e) {
            const options = document.querySelector('.export-options');
            const exportBtn = document.getElementById('export-instructor-btn');
            if (!options || !exportBtn) return;
            if (!exportBtn.contains(e.target) && !(options.contains && options.contains(e.target))) {
                options.style.display = 'none';
            }
        });
    }

    // Manual add form submit
    const addScheduleForm = document.getElementById('add-instructor-schedule-form');
    if (addScheduleForm) {
        addScheduleForm.onsubmit = function(e) {
            e.preventDefault();
            const section = document.getElementById('instructor-manual-section').value;
            const subject = document.getElementById('instructor-manual-subject').value;
            const building = document.getElementById('instructor-manual-building').value;
            const room = document.getElementById('instructor-manual-room').value;
            const day = document.getElementById('instructor-manual-day').value;
            const timeSlot = document.getElementById('instructor-manual-time').value;
            const color = document.getElementById('instructor-manual-color').value;
            const selectedInstructor = document.getElementById('instructor-select').value;

            // Create new schedule entry
            const newSchedule = {
                section: section,
                subject: subject,
                subjectCode: subject,
                instructor: selectedInstructor,
                room: building + ' ' + room,
                day: day,
                slots: [timeSlot],
                color: color
            };

            if (!window.generatedSectionSchedule) window.generatedSectionSchedule = [];
            window.generatedSectionSchedule.push(newSchedule);
            if (window.schedules) window.schedules.push(newSchedule);

            document.getElementById('add-instructor-schedule-modal').style.display = 'none';
            if (typeof populateInstructorSchedule === 'function') {
                populateInstructorSchedule(selectedInstructor);
            }
        };
    }
}
// Export functions for instructor schedule
async function exportInstructorAsImage() {
    const timetableContainer = document.getElementById('instructor-timetable-container');
    const instructor = document.getElementById('instructor-select').value;
    
    if (!timetableContainer) {
        console.error('Timetable container not found');
        return;
    }

    try {
        const canvas = await html2canvas(timetableContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        const link = document.createElement('a');
        link.download = `instructor-timetable-${instructor}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error('Error exporting as image:', error);
        alert('Failed to export timetable as image. Please try again.');
    }
}

async function exportInstructorAsPDF() {
    const timetableContainer = document.getElementById('instructor-timetable-container');
    const instructor = document.getElementById('instructor-select').value;
    
    if (!timetableContainer) {
        console.error('Timetable container not found');
        return;
    }

    try {
        const canvas = await html2canvas(timetableContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({
            orientation: 'landscape',
            unit: 'mm'
        });
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`instructor-timetable-${instructor}.pdf`);
    } catch (error) {
        console.error('Error exporting as PDF:', error);
        alert('Failed to export timetable as PDF. Please try again.');
    }
}

// ... existing code ...

// Helper function to populate instructor schedule
function populateInstructorSchedule(instructorName) {
    // Clear existing schedule
    document.querySelectorAll('[id$="-instructor"]').forEach(cell => {
        cell.innerHTML = '';
    });
    // Filter schedules for the selected instructor
    const instructorSchedules = schedules.filter(schedule => schedule.instructor === instructorName);
    // Group schedules by day and slot for accurate plotting
    const groupedSchedules = new Map();
    instructorSchedules.forEach(schedule => {
        if (!schedule.day || !schedule.slots) return; // Skip if missing
        schedule.slots.forEach(slot => {
            const key = `${schedule.day}-${slot}`;
            groupedSchedules.set(key, {
                ...schedule,
                slot: slot
            });
    });
    });
    // Populate schedule
    groupedSchedules.forEach(schedule => {
        const day = schedule.day.toLowerCase();
        const time = (schedule.slot || '').replace(/[:\s]/g, '');
        const cellId = `${day}-${time}-instructor`;
        const cell = document.getElementById(cellId);
        if (cell) {
            // Extract building from room name
            const building = (schedule.room || '').split(' ')[0] || '';
            // Use the same color as the section schedule
            const color = schedule.color || getSubjectColor(schedule.subjectCode);
            cell.innerHTML += `
                <div class="class-block" style="background:${color};color:#fff;">
                    <div class="subject">${schedule.subject}</div>
                    <div class="section">${schedule.section}</div>
                    <div class="building">${building}</div>
                    <div class="room">${schedule.room}</div>
                </div>
            `;
        }
    });
}

// Helper function to populate schedule
function populateSchedule(schedules) {
    schedules.forEach(schedule => {
        const day = schedule.day.toLowerCase();
        const time = schedule.time.replace(/[:\s]/g, '');
        const cellId = `${day}-${time}`;
        const cell = document.getElementById(cellId);
        
        if (cell) {
            cell.innerHTML += `
                <div class="class-block">
                    <div class="subject">${schedule.subject}</div>
                    <div class="instructor">${schedule.instructor}</div>
                    <div class="room">${schedule.room}</div>
                    <div class="section">${schedule.section}</div>
                </div>
            `;
        }
    });
}

// Get subjects for a specific section based on course and year level
function getSubjectsForSection(section) {
    try {
        // Handle cases where section might be undefined
        if (!section || !section.section) {
            console.warn('Invalid section data:', section);
            return [];
        }

        // Extract course code and year from section code (e.g., "BSA-1A" -> "BSA" and 1)
        const parts = section.section.toString().split('-');
        if (parts.length < 2) {
            console.warn('Invalid section code format:', section.section);
            return [];
        }

        const courseCode = parts[0];
        const sectionCode = parts[1];
        const yearLevel = parseInt(sectionCode) || 1;
        
        // Filter courses that match the section's course and year level
        return courses.filter(course => {
            if (!course || !course.code) return false;

            // Check if the course code matches the section's course code
            const isSameCourse = course.code.startsWith(courseCode);
            
            // For general education subjects that don't have specific course codes
            const isGeneralSubject = ['ARTAP', 'RPH', 'CONWORLD', 'MMW', 'PATHFIT', 'NSTP'].some(
                prefix => course.code.startsWith(prefix)
            );
            
            return isSameCourse || isGeneralSubject;
        });
    } catch (error) {
        console.error('Error getting subjects for section:', error);
        return [];
    }
}

// Helper to convert year number to ordinal string (1 -> 1st, 2 -> 2nd, etc.)
function yearToOrdinal(year) {
    const y = parseInt(year);
    if (isNaN(y)) return year;
    if (y === 1) return '1st';
    if (y === 2) return '2nd';
    if (y === 3) return '3rd';
    return y + 'th';
}

// Helper to convert time string (e.g., '7:00 am') to minutes since midnight
function timeStringToMinutes(timeStr) {
    const [time, meridian] = timeStr.trim().split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (meridian.toLowerCase() === 'pm' && hours !== 12) hours += 12;
    if (meridian.toLowerCase() === 'am' && hours === 12) hours = 0;
    return hours * 60 + minutes;
}

// Helper to check if a slot start time is within an availability range
function isTimeInRange(slotTime, rangeStr) {
    const [start, end] = rangeStr.split(' - ').map(s => s.trim());
    const slotMins = timeStringToMinutes(slotTime);
    const startMins = timeStringToMinutes(start);
    const endMins = timeStringToMinutes(end);
    return slotMins >= startMins && slotMins < endMins;
}

// Helper: check if two days are consecutive (Mon/Tue, Tue/Wed, etc.)
function areDaysConsecutive(day1, day2) {
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const idx1 = daysOrder.indexOf(day1);
    const idx2 = daysOrder.indexOf(day2);
    return Math.abs(idx1 - idx2) === 1;
}

// Helper: filter out lunch break slots (12:00 pm–1:00 pm)
function isLunchBreak(slot) {
    const [start, end] = slot.split(' - ');
    const lunchStart = timeStringToMinutes('12:00 pm');
    const lunchEnd = timeStringToMinutes('1:00 pm');
    const slotStart = timeStringToMinutes(start);
    const slotEnd = timeStringToMinutes(end);
    // If slot overlaps with lunch break
    return (slotStart < lunchEnd && slotEnd > lunchStart);
}

// Shuffle helper to randomize days
function shuffle(array) {
    let arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Generate section-based schedule for all sections using 30-minute slots, enforcing all constraints
function generateSectionBasedSchedule() {
    const subjectInstructorMap = {}; // { [section]: { [subjectCode]: instructorName } }
    const teacherAssignments = {};
    const roomAssignments = {};
    const sectionAssignments = {};
    const instructorAssignmentCount = {};
    const sectionProfessors = {};
    instructors.forEach(inst => instructorAssignmentCount[inst.name] = 0);

    const pickLeastLoadedInstructor = function(qualifiedInstructors) {
        if (!qualifiedInstructors || qualifiedInstructors.length === 0) return null;
        const minCount = Math.min(...qualifiedInstructors.map(i => instructorAssignmentCount[i.name]));
        const leastLoaded = qualifiedInstructors.filter(i => instructorAssignmentCount[i.name] === minCount);
        return leastLoaded[Math.floor(Math.random() * leastLoaded.length)];
    };
    const pickBestInstructor = function(qualifiedInstructors, day) {
        const notAssignedToday = qualifiedInstructors.filter(inst =>
            !teacherAssignments[inst.name]?.[day]
        );
        if (notAssignedToday.length > 0) {
            return pickLeastLoadedInstructor(notAssignedToday);
        }
        return pickLeastLoadedInstructor(qualifiedInstructors);
    };

    const times = [
        '7:00 am - 7:30 am', '7:30 am - 8:00 am', '8:00 am - 8:30 am',
        '8:30 am - 9:00 am', '9:00 am - 9:30 am', '9:30 am - 10:00 am',
        '10:00 am - 10:30 am', '10:30 am - 11:00 am', '11:00 am - 11:30 am',
        '11:30 am - 12:00 pm', '12:00 pm - 12:30 pm', '12:30 pm - 1:00 pm',
        '1:00 pm - 1:30 pm', '1:30 pm - 2:00 pm', '2:00 pm - 2:30 pm',
        '2:30 pm - 3:00 pm', '3:00 pm - 3:30 pm', '3:30 pm - 4:00 pm',
        '4:00 pm - 4:30 pm', '4:30 pm - 5:00 pm', '5:00 pm - 5:30 pm',
        '5:30 pm - 6:00 pm', '6:00 pm - 6:30 pm', '6:30 pm - 7:00 pm',
    ];
    const colorPalette = [
        '#3498db', '#e67e22', '#9b59b6', '#16a085', '#e74c3c', '#2ecc71', '#f39c12', '#34495e', '#1abc9c', '#8e44ad'
    ];
    function getSubjectColor(subject) {
        const idx = subjectColorMap[subject] ?? Object.keys(subjectColorMap).length;
        if (subjectColorMap[subject] === undefined) subjectColorMap[subject] = colorPalette[idx % colorPalette.length];
        return subjectColorMap[subject];
    }
    const subjectColorMap = {};
    const schedule = [];
    const maxBlockSize = 3; // 1.5 hours (3 slots)
    const filteredTimes = times.filter(slot => !isLunchBreak(slot));
    const sectionInstructorMap = {}; // { [section]: { [subjectCode]: instructorName } }

    if (!window.subjectGroups) {
        console.warn('No subject groups loaded.');
        return;
    }
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    // Use only BSA sections for schedule generation
    const filteredSections = sections.filter(s => s.course && s.course.toUpperCase() === 'BSA');
    let sectionCodes = filteredSections.map(s => s.section);
    let sectionSubjects = {};
    // Map each section to the correct subject group by matching course and yearLevel (robust)
    console.log('All section objects:', filteredSections);
    console.log('All subject group keys:', Object.keys(window.subjectGroups));
    for (const sec of sectionCodes) {
        console.log(`[SCHED] Scheduling section: ${sec}`);
        const sectionObj = filteredSections.find(s => s.section === sec);
        // --- Improved matching logic ---
        let foundGroup = null;
        // Try direct match
        if (window.subjectGroups[sec]) {
            foundGroup = sec;
            console.log(`[MATCH] Direct match for section ${sec} in subjectGroups.`);
        } else {
            // Extract course and year from section code (e.g., BSA-1D)
            let sectionParts = sectionObj.section.split('-');
            let courseCode = sectionParts[0];
            let yearNum = 1;
            if (sectionParts[1]) {
                let yearMatch = sectionParts[1].match(/(\d+)/);
                if (yearMatch) yearNum = parseInt(yearMatch[1], 10);
            }
            let yearOrdinal = getYearOrdinal(yearNum);
            const normalize = str => (str || '').replace(/\s+/g, '').toLowerCase();
            // Print debug info for matching
            console.log(`[DEBUG] Trying to match section ${sec} (course: ${courseCode}, year: ${yearNum}, ordinal: ${yearOrdinal})`);
            // Try to match both course and year (ordinal and numeric)
            for (const groupKey of Object.keys(window.subjectGroups)) {
                const normKey = normalize(groupKey);
                if (
                    (normKey.includes(normalize(courseCode)) && normKey.includes(normalize(yearOrdinal) + 'year')) ||
                    (normKey.includes(normalize(courseCode)) && normKey.includes(yearNum + 'year'))
                ) {
                    foundGroup = groupKey;
                    console.log(`[MATCH] Found by course and year: ${groupKey}`);
                    break;
                }
            }
            // Try to match just course
            if (!foundGroup) {
                for (const groupKey of Object.keys(window.subjectGroups)) {
                    if (normalize(groupKey).includes(normalize(courseCode))) {
                        foundGroup = groupKey;
                        console.log(`[MATCH] Found by course only: ${groupKey}`);
                        break;
                    }
                }
            }
            // Try to match by partial course name (first 3+ chars)
            if (!foundGroup && courseCode.length > 3) {
                const partial = normalize(courseCode).slice(0, 4);
                for (const groupKey of Object.keys(window.subjectGroups)) {
                    if (normalize(groupKey).includes(partial)) {
                        foundGroup = groupKey;
                        console.log(`[MATCH] Found by partial course: ${groupKey}`);
                        break;
                    }
                }
            }
        }
        if (!foundGroup) {
            console.warn(`[SCHED] No subjects found for section ${sectionObj.section}`);
            console.warn(`[SCHED] Available subject group keys:`, Object.keys(window.subjectGroups));
        } else {
            sectionSubjects[sec] = window.subjectGroups[foundGroup];
        }
        const subjects = sectionSubjects[sec] || [];
        let subjectSlotsRemaining = {};
        subjects.forEach(subj => {
            // Check if it's a major subject
            const isMajor = isMajorSubject(subj.code, sectionObj.course);
            // Set slots based on whether it's a major subject
            subjectSlotsRemaining[subj.code] = isMajor ? 6 : (subj.credit ? Math.round(subj.credit * 2) : 2);
        });
        for (const subj of subjects) {
            let slotsLeft = subjectSlotsRemaining[subj.code];
            let totalScheduled = 0;
            const isNSTP = subj.code && subj.code.toUpperCase().includes('NSTP');
            const isMajor = isMajorSubject(subj.code, sectionObj.course);
            const year = parseInt(sectionObj.yearLevel);
            // Restrict non-NSTP subjects to Monday-Friday only
            const allowedDays = isNSTP ? ['Saturday'] : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            if (isNSTP) {
                // Schedule NSTP like other subjects, but only on Saturday
                let scheduled = false;
                const nstpDay = 'Saturday';
                const nstpSlots = subj.credit === 2 ? 4 : 6; // 2 hours = 4 slots, fallback to 6 if not 2 credits
                let slotsLeft = nstpSlots;
                let totalScheduled = 0;
                const timeSlotsOrdered = filteredTimes;
                let blockScheduled = false;
                // Track used buildings and time slots for NSTP on Saturday
                if (!window.nstpUsedBuildings) window.nstpUsedBuildings = {};
                if (!window.nstpUsedTimeSlots) window.nstpUsedTimeSlots = {};
                for (let t = 0; t <= timeSlotsOrdered.length - nstpSlots; t++) {
                    const slotRange = timeSlotsOrdered.slice(t, t + nstpSlots);
                    if (slotRange.length < nstpSlots) continue;
                    if (slotRange.some(isLunchBreak)) continue;
                    let sectionConflict = schedule.some(entry =>
                        entry.section === sec &&
                        entry.day === nstpDay &&
                        entry.slots.some(s => slotRange.includes(s))
                    );
                    if (sectionConflict) continue;
                    let assignedInstructor = null;
                    if (!sectionProfessors[sec]) sectionProfessors[sec] = new Set();
                    if (!subjectInstructorMap[sec]) subjectInstructorMap[sec] = {};
                    if (subjectInstructorMap[sec][subj.code]) {
                        assignedInstructor = instructors.find(i => i.name === subjectInstructorMap[sec][subj.code]);
                        if (!assignedInstructor || sectionProfessors[sec].has(assignedInstructor.name)) assignedInstructor = null;
                    }
                    // Fallback: try any available qualified instructor if preferred is not available
                    if (!assignedInstructor) {
                        const availableTeachers = findAvailableInstructors(subj).filter(inst => !sectionProfessors[sec].has(inst.name));
                        for (const instructor of availableTeachers) {
                            let conflict = false;
                            for (const slot of slotRange) {
                                if (teacherAssignments[instructor.name] && teacherAssignments[instructor.name][nstpDay] && teacherAssignments[instructor.name][nstpDay][slot]) {
                                    conflict = true;
                                    break;
                                }
                            }
                                    if (conflict) continue;
                                    assignedInstructor = instructor;
                                    break;
                                }
                            }
                            if (!assignedInstructor) continue;
                            const studentCount = (sections.find(s => s.section === sec)?.students) || 0;
                            // Find available rooms in different buildings for NSTP
                            const availableRooms = findSuitableRooms(studentCount, subj).filter(room => {
                                const building = (room.name.split(' ')[0] || '').toUpperCase();
                                // Avoid using the same building and time slot for another NSTP section
                                const usedBuildings = window.nstpUsedBuildings[slotRange[0]] || new Set();
                                return !usedBuildings.has(building);
                            });
                            const room = availableRooms.length > 0 ? availableRooms[0] : null;
                            if (!room) continue;
                            // Avoid using the same time slot for another NSTP section
                            const slotKey = slotRange.join('|');
                            if (window.nstpUsedTimeSlots[slotKey]) continue;
                            // Mark building and time slot as used for NSTP
                            const building = (room.name.split(' ')[0] || '').toUpperCase();
                            if (!window.nstpUsedBuildings[slotRange[0]]) window.nstpUsedBuildings[slotRange[0]] = new Set();
                            window.nstpUsedBuildings[slotRange[0]].add(building);
                            window.nstpUsedTimeSlots[slotKey] = true;
                            schedule.push({
                                section: sec,
                                subject: subj.title,
                                subjectCode: subj.code,
                                instructor: assignedInstructor.name,
                                room: room.name,
                                day: nstpDay,
                                slots: slotRange,
                                color: getSubjectColor(subj.code)
                            });
                            slotRange.forEach(slot => {
                                if (!teacherAssignments[assignedInstructor.name]) teacherAssignments[assignedInstructor.name] = {};
                                if (!teacherAssignments[assignedInstructor.name][nstpDay]) teacherAssignments[assignedInstructor.name][nstpDay] = {};
                                teacherAssignments[assignedInstructor.name][nstpDay][slot] = true;
                                if (!roomAssignments[room.name]) roomAssignments[room.name] = {};
                                if (!roomAssignments[room.name][nstpDay]) roomAssignments[room.name][nstpDay] = {};
                                roomAssignments[room.name][nstpDay][slot] = true;
                                if (!sectionAssignments[sec]) sectionAssignments[sec] = {};
                                if (!sectionAssignments[sec][nstpDay]) sectionAssignments[sec][nstpDay] = {};
                                sectionAssignments[sec][nstpDay][slot] = true;
                            });
                            sectionProfessors[sec].add(assignedInstructor.name);
                            slotsLeft -= nstpSlots;
                            totalScheduled += nstpSlots;
                            subjectSlotsRemaining[subj.code] -= nstpSlots;
                            blockScheduled = true;
                            break;
                        }
                        if (!blockScheduled) {
                            console.warn(`[DEBUG] Could not schedule ${nstpSlots} slots for NSTP subject ${subj.title} (${subj.code}) in section ${sec} on Saturday`);
                        }
                        if (slotsLeft > 0) {
                            console.warn(`[SCHED][WARNING] NSTP Subject ${subj.title} (${subj.code}) scheduled for only ${totalScheduled} slots (required: ${nstpSlots})`);
                        }
                        continue;
                    } else if (isMajor && year === 4) {
                        // 4th year: schedule a single 6-slot block
                        let scheduled = false;
                        const shuffledDays = shuffle(allowedDays);
                        for (const day of shuffledDays) {
                            const timeSlotsOrdered = filteredTimes;
                            for (let t = 0; t <= timeSlotsOrdered.length - 6; t++) {
                                const slotRange = timeSlotsOrdered.slice(t, t + 6);
                                if (slotRange.length < 6) continue;
                                if (slotRange.some(isLunchBreak)) continue;
                                let sectionConflict = schedule.some(entry =>
                                    entry.section === sec &&
                                    entry.day === day &&
                                    entry.slots.some(s => slotRange.includes(s))
                                );
                                if (sectionConflict) continue;
                    let assignedInstructor = null;
                                if (!sectionProfessors[sec]) sectionProfessors[sec] = new Set();
                                if (!subjectInstructorMap[sec]) subjectInstructorMap[sec] = {};
                    if (subjectInstructorMap[sec][subj.code]) {
                        assignedInstructor = instructors.find(i => i.name === subjectInstructorMap[sec][subj.code]);
                        if (!assignedInstructor || sectionProfessors[sec].has(assignedInstructor.name)) continue;
                    } else {
                        const availableTeachers = findAvailableInstructors(subj).filter(inst => !sectionProfessors[sec].has(inst.name));
                        assignedInstructor = availableTeachers.length > 0 ? availableTeachers[0] : null;
                        if (assignedInstructor) subjectInstructorMap[sec][subj.code] = assignedInstructor.name;
                    }
                    if (!assignedInstructor) continue;
                    const studentCount = (sections.find(s => s.section === sec)?.students) || 0;
                                const availableRooms = findSuitableRooms(studentCount, subj);
                    const room = availableRooms.length > 0 ? availableRooms[0] : null;
                    if (!room) continue;
                    schedule.push({
                        section: sec,
                        subject: subj.title,
                        subjectCode: subj.code,
                        instructor: assignedInstructor.name,
                        room: room.name,
                                    day,
                        slots: slotRange,
                        color: getSubjectColor(subj.code)
                    });
                    slotRange.forEach(slot => {
                        if (!teacherAssignments[assignedInstructor.name]) teacherAssignments[assignedInstructor.name] = {};
                                    if (!teacherAssignments[assignedInstructor.name][day]) teacherAssignments[assignedInstructor.name][day] = {};
                                    teacherAssignments[assignedInstructor.name][day][slot] = true;
                        if (!roomAssignments[room.name]) roomAssignments[room.name] = {};
                                    if (!roomAssignments[room.name][day]) roomAssignments[room.name][day] = {};
                                    roomAssignments[room.name][day][slot] = true;
                        if (!sectionAssignments[sec]) sectionAssignments[sec] = {};
                                    if (!sectionAssignments[sec][day]) sectionAssignments[sec][day] = {};
                                    sectionAssignments[sec][day][slot] = true;
                    });
                    sectionProfessors[sec].add(assignedInstructor.name);
                                slotsLeft -= 6;
                                totalScheduled += 6;
                                subjectSlotsRemaining[subj.code] -= 6;
                                scheduled = true;
                    break;
                            }
                            if (scheduled) break;
                        }
                        if (!scheduled) {
                            console.warn(`[DEBUG] Could not schedule 6 slots for subject ${subj.title} (${subj.code}) in section ${sec}`);
                }
                if (slotsLeft > 0) {
                            console.warn(`[SCHED][WARNING] Subject ${subj.title} (${subj.code}) scheduled for only ${totalScheduled} slots (required: 6)`);
                        }
                        continue;
                    } else if (isMajor && (year === 1 || year === 2 || year === 3)) {
                        // 1st-3rd year: schedule two 3-slot blocks, prefer same instructor, fallback to any available
                        let scheduledBlocks = 0;
                        let preferredInstructor = null;
                        if (!sectionProfessors[sec]) sectionProfessors[sec] = new Set();
                        if (!subjectInstructorMap[sec]) subjectInstructorMap[sec] = {};
                        // Try to find a preferred instructor for both blocks
                        if (subjectInstructorMap[sec][subj.code]) {
                            preferredInstructor = instructors.find(i => i.name === subjectInstructorMap[sec][subj.code]);
                        } else {
                            const availableTeachers = findAvailableInstructors(subj).filter(inst => !sectionProfessors[sec].has(inst.name));
                            preferredInstructor = availableTeachers.length > 0 ? availableTeachers[0] : null;
                            if (preferredInstructor) subjectInstructorMap[sec][subj.code] = preferredInstructor.name;
                        }
                        for (let block = 0; block < 2; block++) {
                            let scheduled = false;
                            const shuffledDays = shuffle(allowedDays);
                            // Try preferred instructor first
                            let instructorTried = false;
                            if (preferredInstructor) {
                                for (const day of shuffledDays) {
                                    const timeSlotsOrdered = filteredTimes;
                                    for (let t = 0; t <= timeSlotsOrdered.length - 3; t++) {
                                        const slotRange = timeSlotsOrdered.slice(t, t + 3);
                                        if (slotRange.length < 3) continue;
                                        if (slotRange.some(isLunchBreak)) continue;
                                        let sectionConflict = schedule.some(entry =>
                                            entry.section === sec &&
                                            entry.day === day &&
                                            entry.slots.some(s => slotRange.includes(s))
                                        );
                                        if (sectionConflict) continue;
                                        // Check if instructor is available for all slots
                                        let instructorConflict = false;
                                        for (const slot of slotRange) {
                                            if (teacherAssignments[preferredInstructor.name] && teacherAssignments[preferredInstructor.name][day] && teacherAssignments[preferredInstructor.name][day][slot]) {
                                                instructorConflict = true;
                                                break;
                                            }
                                        }
                                        if (instructorConflict) continue;
                                        const studentCount = (sections.find(s => s.section === sec)?.students) || 0;
                                        const availableRooms = findSuitableRooms(studentCount, subj);
                                        const room = availableRooms.length > 0 ? availableRooms[0] : null;
                                        if (!room) continue;
                                        schedule.push({
                                            section: sec,
                                            subject: subj.title,
                                            subjectCode: subj.code,
                                            instructor: preferredInstructor.name,
                                            room: room.name,
                                            day,
                                            slots: slotRange,
                                            color: getSubjectColor(subj.code)
                                        });
                                        slotRange.forEach(slot => {
                                            if (!teacherAssignments[preferredInstructor.name]) teacherAssignments[preferredInstructor.name] = {};
                                            if (!teacherAssignments[preferredInstructor.name][day]) teacherAssignments[preferredInstructor.name][day] = {};
                                            teacherAssignments[preferredInstructor.name][day][slot] = true;
                                            if (!roomAssignments[room.name]) roomAssignments[room.name] = {};
                                            if (!roomAssignments[room.name][day]) roomAssignments[room.name][day] = {};
                                            roomAssignments[room.name][day][slot] = true;
                                            if (!sectionAssignments[sec]) sectionAssignments[sec] = {};
                                            if (!sectionAssignments[sec][day]) sectionAssignments[sec][day] = {};
                                            sectionAssignments[sec][day][slot] = true;
                                        });
                                        sectionProfessors[sec].add(preferredInstructor.name);
                                        slotsLeft -= 3;
                                        totalScheduled += 3;
                                        subjectSlotsRemaining[subj.code] -= 3;
                                        scheduledBlocks++;
                                        scheduled = true;
                                        instructorTried = true;
                                        break;
                                    }
                                    if (scheduled) break;
                                }
                            }
                            // If not scheduled with preferred instructor, try any available instructor for this block
                            if (!scheduled) {
                                const availableTeachers = findAvailableInstructors(subj).filter(inst => !sectionProfessors[sec].has(inst.name));
                                for (const instructor of availableTeachers) {
                                    for (const day of shuffledDays) {
                                        const timeSlotsOrdered = filteredTimes;
                                        for (let t = 0; t <= timeSlotsOrdered.length - 3; t++) {
                                            const slotRange = timeSlotsOrdered.slice(t, t + 3);
                                            if (slotRange.length < 3) continue;
                                            if (slotRange.some(isLunchBreak)) continue;
                                            let sectionConflict = schedule.some(entry =>
                                                entry.section === sec &&
                                                entry.day === day &&
                                                entry.slots.some(s => slotRange.includes(s))
                                            );
                                            if (sectionConflict) continue;
                                            // Check if instructor is available for all slots
                                            let instructorConflict = false;
                                            for (const slot of slotRange) {
                                                if (teacherAssignments[instructor.name] && teacherAssignments[instructor.name][day] && teacherAssignments[instructor.name][day][slot]) {
                                                    instructorConflict = true;
                                                    break;
                                                }
                                            }
                                            if (instructorConflict) continue;
                                            const studentCount = (sections.find(s => s.section === sec)?.students) || 0;
                                            const availableRooms = findSuitableRooms(studentCount, subj);
                                            const room = availableRooms.length > 0 ? availableRooms[0] : null;
                                            if (!room) continue;
                                            schedule.push({
                                                section: sec,
                                                subject: subj.title,
                                                subjectCode: subj.code,
                                                instructor: instructor.name,
                                                room: room.name,
                                                day,
                                                slots: slotRange,
                                                color: getSubjectColor(subj.code)
                                            });
                                            slotRange.forEach(slot => {
                                                if (!teacherAssignments[instructor.name]) teacherAssignments[instructor.name] = {};
                                                if (!teacherAssignments[instructor.name][day]) teacherAssignments[instructor.name][day] = {};
                                                teacherAssignments[instructor.name][day][slot] = true;
                                                if (!roomAssignments[room.name]) roomAssignments[room.name] = {};
                                                if (!roomAssignments[room.name][day]) roomAssignments[room.name][day] = {};
                                                roomAssignments[room.name][day][slot] = true;
                                                if (!sectionAssignments[sec]) sectionAssignments[sec] = {};
                                                if (!sectionAssignments[sec][day]) sectionAssignments[sec][day] = {};
                                                sectionAssignments[sec][day][slot] = true;
                                            });
                                            sectionProfessors[sec].add(instructor.name);
                                            slotsLeft -= 3;
                                            totalScheduled += 3;
                                            subjectSlotsRemaining[subj.code] -= 3;
                                            scheduledBlocks++;
                                            scheduled = true;
                                            break;
                                        }
                                        if (scheduled) break;
                                    }
                                    if (scheduled) break;
                                }
                            }
                            if (!scheduled) {
                                console.warn(`[DEBUG] Could not schedule block ${block + 1} for major subject ${subj.title} (${subj.code}) in section ${sec}`);
                            }
                        }
                        if (totalScheduled < 6) {
                            console.warn(`[SCHED][WARNING] Subject ${subj.title} (${subj.code}) scheduled for only ${totalScheduled} slots (required: 6)`);
                        }
                        continue;
                    }
                    // ... existing logic for non-major and other subjects ...
            while (slotsLeft > 0) {
                let scheduled = false;
                        const shuffledDays = shuffle(allowedDays);
                for (const day of shuffledDays) {
                    const timeSlotsOrdered = filteredTimes;
                    const startOffset = Math.floor(Math.random() * timeSlotsOrdered.length);
                            const maxBlockSize = Math.min(3, slotsLeft);
                            for (let blockSize = maxBlockSize; blockSize >= 1; blockSize--) {
                        for (let t = 0; t <= timeSlotsOrdered.length - blockSize; t++) {
                            const idx = (t + startOffset) % (timeSlotsOrdered.length - blockSize + 1);
                            const slotRange = timeSlotsOrdered.slice(idx, idx + blockSize);
                            if (slotRange.length < blockSize) continue;
                            if (slotRange.some(isLunchBreak)) continue;
                            let sectionConflict = schedule.some(entry =>
                                entry.section === sec &&
                                entry.day === day &&
                                entry.slots.some(s => slotRange.includes(s))
                            );
                                    if (sectionConflict) continue;
                            let assignedInstructor = null;
                            if (!sectionProfessors[sec]) sectionProfessors[sec] = new Set();
                                    if (!subjectInstructorMap[sec]) subjectInstructorMap[sec] = {};
                                    if (subjectInstructorMap[sec][subj.code]) {
                                assignedInstructor = instructors.find(i => i.name === subjectInstructorMap[sec][subj.code]);
                                        if (!assignedInstructor || sectionProfessors[sec].has(assignedInstructor.name)) assignedInstructor = null;
                                    }
                                    // Fallback: try any available qualified instructor if preferred is not available
                                    if (!assignedInstructor) {
                                        const availableTeachers = findAvailableInstructors(subj).filter(inst => !sectionProfessors[sec].has(inst.name));
                                        for (const instructor of availableTeachers) {
                                            let conflict = false;
                                            for (const slot of slotRange) {
                                                if (teacherAssignments[instructor.name] && teacherAssignments[instructor.name][day] && teacherAssignments[instructor.name][day][slot]) {
                                                    conflict = true;
                                                    break;
                                                }
                                            }
                                            if (conflict) continue;
                                            assignedInstructor = instructor;
                                            break;
                                }
                            }
                            if (!assignedInstructor) continue;
                            const studentCount = (sections.find(s => s.section === sec)?.students) || 0;
                            const availableRooms = findSuitableRooms(studentCount, subj);
                            const room = availableRooms.length > 0 ? availableRooms[0] : null;
                            if (!room) continue;            
                            schedule.push({
                                section: sec,
                                subject: subj.title,
                                subjectCode: subj.code,
                                instructor: assignedInstructor.name,
                                room: room.name,
                                day,
                                slots: slotRange,
                                color: getSubjectColor(subj.code)
                            });
                            slotRange.forEach(slot => {
                                if (!teacherAssignments[assignedInstructor.name]) teacherAssignments[assignedInstructor.name] = {};
                                if (!teacherAssignments[assignedInstructor.name][day]) teacherAssignments[assignedInstructor.name][day] = {};
                                teacherAssignments[assignedInstructor.name][day][slot] = true;
                                if (!roomAssignments[room.name]) roomAssignments[room.name] = {};
                                if (!roomAssignments[room.name][day]) roomAssignments[room.name][day] = {};
                                roomAssignments[room.name][day][slot] = true;
                                if (!sectionAssignments[sec]) sectionAssignments[sec] = {};
                                if (!sectionAssignments[sec][day]) sectionAssignments[sec][day] = {};
                                sectionAssignments[sec][day][slot] = true;
                            });
                            sectionProfessors[sec].add(assignedInstructor.name);
                            slotsLeft -= blockSize;
                            totalScheduled += blockSize;
                            subjectSlotsRemaining[subj.code] -= blockSize;
                            scheduled = true;
                            break;
                        }
                        if (scheduled) break;
                    }
                    if (slotsLeft <= 0) break;
                }
                if (!scheduled) {
                    console.warn(`[DEBUG] Could not schedule remaining ${slotsLeft} slots for subject ${subj.title} (${subj.code}) in section ${sec}`);
                    break;
                }
            }
            if (slotsLeft > 0) {
                        console.warn(`[SCHED][WARNING] Subject ${subj.title} (${subj.code}) scheduled for only ${totalScheduled} slots (required: ${subjectSlotsRemaining[subj.code] + totalScheduled})`);
            }
        }
    }
    // This will ensure subjects are split across multiple days as needed.

    
    console.log('Generated schedule:', schedule);
    console.log('Section codes:', sectionCodes);
    console.log('SectionSubjects:', sectionSubjects);
    window.generatedSectionSchedule = schedule;
    schedules = schedule;
    if (typeof showScheduler === 'function') showScheduler();
}

function getYearOrdinal(year) {
    return yearToOrdinal(year);
}

// Helper function to generate random color
function getRandomColor() {
    const colors = [
        '#3498db', '#e67e22', '#9b59b6', '#16a085', '#e74c3c', 
        '#2ecc71', '#f39c12', '#34495e', '#1abc9c', '#8e44ad'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function estimateResourceNeeds() {
    let totalSlotsNeeded = 0;
    let totalSubjects = 0;
    let totalSections = 0;
    let allSubjects = [];
    for (const secObj of sections) {
        const course = secObj.course.trim();
        const year = secObj.yearLevel;
        const yearOrdinal = getYearOrdinal(year);
        let foundGroup = null;
        for (const sem of ['1st Sem', '2nd Sem']) {
            for (const groupKey of Object.keys(window.subjectGroups)) {
                if (
                    groupKey.toLowerCase().includes(yearOrdinal.toLowerCase()) &&
                    groupKey.toLowerCase().includes(sem.toLowerCase()) &&
                    groupKey.toLowerCase().includes(course.toLowerCase())
                ) {
                    foundGroup = groupKey;
                    break;
                }
            }
            if (foundGroup) break;
        }
        if (foundGroup) {
            const subjects = window.subjectGroups[foundGroup];
            for (const subj of subjects) {
                const slots = subj.credit ? Math.round(subj.credit * 2) : 2;
                totalSlotsNeeded += slots;
                allSubjects.push({ section: secObj.section, subject: subj.title, slots });
                totalSubjects++;
            }
            totalSections++;
        }
    }
    // Assume 22 slots per week per instructor/room (e.g., 7:00am-7:00pm, 30min slots, 5 days, minus lunch)
    const slotsPerWeek = 22 * 5; // adjust as per your timetable
    const minInstructors = Math.ceil(totalSlotsNeeded / slotsPerWeek);
    const minRooms = minInstructors; // same logic for rooms if all classes are evenly distributed

    console.log('Total sections:', totalSections);
    console.log('Total subjects:', totalSubjects);
    console.log('Total slots needed:', totalSlotsNeeded);
    console.log('Estimated minimum instructors needed:', minInstructors);
    console.log('Estimated minimum rooms needed:', minRooms);
    // Optionally, print allSubjects for detailed breakdown
    // console.log(allSubjects);
}

// ... existing code ...
// Call this after schedule generation
generateSectionBasedSchedule();
estimateResourceNeeds();
// ... existing code ...           

    // Helper function to identify major subjects
    function isMajorSubject(subjectCode, courseCode) {
        // Convert to uppercase for consistent comparison
        const code = subjectCode.toUpperCase();
        const course = courseCode.toUpperCase();
        
        // Define major subject patterns for each course
        const majorSubjectPatterns = {
            'BSA': ['ACCTG', 'BACC', 'BA FIN', 'ECO', 'CBME'],
            'BSAIS': ['AIS', 'PRE', 'ECO', 'CBME'],
            'BS MARKETING': ['MKTG', 'ECO', 'CBME'],
            'BSE': ['ENTBE', 'INNOMNGT', 'PPENTDEV', 'SOCENT', 'ENT TRACK', 'ECO', 'CBME'],
            'BS PUBLIC ADMINISTRATION': ['BPA', 'ECO', 'CBME']
        };
        
        // Get the patterns for the course
        const patterns = majorSubjectPatterns[course] || [];
        
        // Check if the subject code matches any of the patterns
        return patterns.some(pattern => code.includes(pattern));
    }