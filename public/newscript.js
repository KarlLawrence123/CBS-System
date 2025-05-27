
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
    setupHamburgerMenu(); // Add this line
});

function setupHamburgerMenu() {
    // Create hamburger button
    let hamburger = document.querySelector('.hamburger');
    if (!hamburger) {
        hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.appendChild(hamburger);
    }
    const sidebar = document.querySelector('.sidebar');
    // Create sidebar overlay
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }
    hamburger.onclick = function(e) {
        e.stopPropagation();
        sidebar.classList.toggle('open');
        overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
    };
    overlay.onclick = function() {
        sidebar.classList.remove('open');
        overlay.style.display = 'none';
    };
    // Close sidebar when clicking outside (on mobile)
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 700 && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
                sidebar.classList.remove('open');
                overlay.style.display = 'none';
            }
        }
    });
    // Close sidebar when clicking a menu item (on mobile)
    sidebar.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 700) {
                sidebar.classList.remove('open');
                overlay.style.display = 'none';
            }
        });
    });
}

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
                                            day: day || 'Monday - Sunday',
                                            availability: {
                                                days: day ? day.split('-').map(d => d.trim()) : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
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
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
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
    // Count active schedules from generatedSectionSchedule or schedules
    const activeSchedules = (window.generatedSectionSchedule ? window.generatedSectionSchedule.length : (schedules ? schedules.length : 0));

    const html = `
        <div class="dashboard-title">Dashboard</div>
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
        <div class="dashboard-cards" style="margin-top:48px;">
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
    // Get unique courses from sections
    const allCourses = [...new Set(sections.map(s => s.course))];
    let selectedCourse = window.selectedSchedulerCourse || allCourses[0];
    // Get sections for the selected course
    const courseSections = sections.filter(s => s.course === selectedCourse);
    const allSectionOptions = ['All sections', ...courseSections.map(s => s.section)];
    let selectedSection = window.selectedSchedulerSection || 'All sections';
    if (!allSectionOptions.includes(selectedSection)) selectedSection = 'All sections';

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const times = [
        '7:00 am - 7:30 am', '7:30 am - 8:00 am', '8:00 am - 8:30 am',
        '8:30 am - 9:00 am', '9:00 am - 9:30 am', '9:30 am - 10:00 am',
        '10:00 am - 10:30 am', '10:30 am - 11:00 am', '11:00 am - 11:30 am',
        '11:30 am - 12:00 pm', '12:00 pm - 12:30 pm', '12:30 pm - 1:00 pm',
        '1:00 pm - 1:30 pm', '1:30 am - 2:00 pm', '2:00 pm - 2:30 pm',
        '2:30 pm - 3:00 pm', '3:00 pm - 3:30 pm', '3:30 pm - 4:00 pm',
        '4:00 pm - 4:30 pm', '4:30 pm - 5:00 pm', '5:00 pm - 5:30 pm',
        '5:30 pm - 6:00 pm', '6:00 pm - 6:30 pm', '6:30 pm - 7:00 pm',
    ];

    // UI for course and section selection
    let html = `
        <div class="scheduler-container">
            <div class="scheduler-actions">
                ${selectedSection !== 'All sections' ? `
                <button id="add-schedule-btn" class="primary-btn"><i class="fas fa-plus"></i> Add Schedule</button>
                <div class="export-dropdown">
                    <button id="export-btn" class="primary-btn"><i class="fas fa-download"></i> Export</button>
                    <div class="export-options">
                        <button id="export-image-btn" class="export-option"><i class="fas fa-image"></i> Save as Image</button>
                        <button id="export-pdf-btn" class="export-option"><i class="fas fa-file-pdf"></i> Save as PDF</button>
                    </div>
                </div>
                ` : ''}
            </div>
            <div class="scheduler-main-controls">
                <div>
                    <label for="course-sched-select"><strong>Course:</strong></label>
                    <select id="course-sched-select">
                        ${allCourses.map(course => `<option value="${course}"${course === selectedCourse ? ' selected' : ''}>${course}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label for="section-sched-select"><strong>Section:</strong></label>
                    <select id="section-sched-select">
                        ${allSectionOptions.map(sec => `<option value="${sec}"${sec === selectedSection ? ' selected' : ''}>${sec}</option>`).join('')}
                    </select>
                </div>
                <button id="generate-schedule-btn" class="primary-btn">Generate Schedule</button>
            </div>
            <div class="timetable-container" id="timetable-container"></div>
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
                            <option value="6">3 hours</option>
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

    // Export button logic
    if (selectedSection !== 'All sections') {
        document.getElementById('export-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            const options = document.querySelector('.export-options');
            options.style.display = options.style.display === 'block' ? 'none' : 'block';
        });
        document.getElementById('export-image-btn').addEventListener('click', function() {
            exportAsImage();
        });
        document.getElementById('export-pdf-btn').addEventListener('click', function() {
            exportAsPDF();
        });
        // Close export options when clicking outside
        document.addEventListener('click', function(e) {
            const options = document.querySelector('.export-options');
            const exportBtn = document.getElementById('export-btn');
            if (options && !exportBtn.contains(e.target) && !options.contains(e.target)) {
                options.style.display = 'none';
            }
        });
    }
    // Add Schedule button logic
    if (selectedSection !== 'All sections') {
        document.getElementById('add-schedule-btn').addEventListener('click', function() {
            document.getElementById('add-schedule-modal').style.display = 'block';
        });
        document.getElementById('add-schedule-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const subjectCode = document.getElementById('subject-code').value;
            const subjectTitle = document.getElementById('subject-title').value;
            const instructor = document.getElementById('instructor-select').value;
            const room = document.getElementById('room-select').value;
            const day = document.getElementById('day-select').value;
            const timeSlot = document.getElementById('time-select').value;
            const duration = parseInt(document.getElementById('duration').value);
            const timeIndex = times.indexOf(timeSlot);
            const slots = times.slice(timeIndex, timeIndex + duration);
            // Conflict check
            const conflicts = (window.generatedSectionSchedule || []).some(sched =>
                sched.day === day &&
                sched.slots.some(slot => slots.includes(slot)) &&
                (
                    sched.room === room ||
                    sched.instructor === instructor ||
                    sched.section === selectedSection
                )
            );
            if (conflicts) {
                showWarningModal('This slot is already taken for the selected room, instructor, or section. Please choose a different time or resource.');
                return;
            }
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
            if (!window.generatedSectionSchedule) {
                window.generatedSectionSchedule = [];
            }
            window.generatedSectionSchedule.push(newSchedule);
            document.getElementById('add-schedule-modal').style.display = 'none';
            // Refresh view
            let filteredSections = sections.filter(s => s.section === selectedSection && s.course === selectedCourse);
            displayFilteredSchedule(filteredSections, days, times);
        });
    }

    // Handlers for dropdowns
    document.getElementById('course-sched-select').addEventListener('change', function() {
        window.selectedSchedulerCourse = this.value;
        window.selectedSchedulerSection = 'All sections';
        showScheduler();
    });
    document.getElementById('section-sched-select').addEventListener('change', function() {
        window.selectedSchedulerSection = this.value;
        showScheduler();
    });

    // Handler for generate button
    document.getElementById('generate-schedule-btn').addEventListener('click', function() {
        let filteredSections;
        if (selectedSection === 'All sections') {
            filteredSections = sections.filter(s => s.course === selectedCourse);
            generateSectionBasedScheduleFiltered(filteredSections);
            showGenerationModal('Schedules generated for all sections. Please select a specific section to view its timetable.', 'All Sections Generated');
            document.getElementById('timetable-container').innerHTML = '<div style="padding:32px;text-align:center;color:#fff;font-size:1.2em;">Please select a specific section to view its timetable.</div>';
        } else {
            filteredSections = sections.filter(s => s.section === selectedSection && s.course === selectedCourse);
            generateSectionBasedScheduleFiltered(filteredSections);
            displayFilteredSchedule(filteredSections, days, times);
            showGenerationModal('Schedule generation successful!');
        }
    });

    // Always display the timetable grid, even if no schedule is generated
    let filteredSections;
    if (selectedSection === 'All sections') {
        document.getElementById('timetable-container').innerHTML = '<div style="padding:32px;text-align:center;color:#fff;font-size:1.2em;">Please select a specific section to view its timetable.</div>';
    } else {
        filteredSections = sections.filter(s => s.section === selectedSection && s.course === selectedCourse);
        displayFilteredSchedule(filteredSections, days, times);
    }

    animateMainContent();
}

// Helper: generate schedule for only the filtered sections
function generateSectionBasedScheduleFiltered(filteredSections) {
    generateSectionBasedSchedule(filteredSections);
}

// Helper: display the schedule for the filtered sections
function displayFilteredSchedule(filteredSections, days, times) {
    // Filter the generated schedule for these sections
    const schedule = (window.generatedSectionSchedule || []).filter(s => filteredSections.some(sec => sec.section === s.section));
    // Always render the timetable grid, even if schedule is empty
    let html = `<table class="timetable"><thead><tr><th>Time</th>${days.map(day => `<th>${day}</th>`).join('')}</tr></thead><tbody>`;
    const rowspanTracker = {};
    days.forEach(day => { rowspanTracker[day] = 0; });
    times.forEach((time, timeIdx) => {
        html += `<tr><td>${time}</td>`;
        days.forEach(day => {
            if (rowspanTracker[day] > 0) {
                rowspanTracker[day]--;
                return;
            }
            const entries = schedule.filter(sch =>
                filteredSections.some(sec => sec.section === sch.section) &&
                sch.day === day &&
                sch.slots && sch.slots.includes(time)
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
                        html += `<td rowspan="${rowspan}" style="background:${entry.color};color:#fff;vertical-align:middle;text-align:center;min-width:120px;position:relative;">
                            <button class='delete-class-btn' title='Delete' data-section='${entry.section}' data-subject='${entry.subject}' data-day='${entry.day}' data-slot='${time}' style='position:absolute;top:4px;right:4px;width:22px;height:22px;border:none;border-radius:50%;background:#e74c3c;color:#fff;font-size:1.1em;line-height:1;cursor:pointer;z-index:2;display:flex;align-items:center;justify-content:center;padding:0;'>&times;</button>
                            <div style="font-weight:700;font-size:1.1em;">${entry.subject}</div>
                            <div style="font-size:0.95em;">${entry.subjectCode}</div>
                            <div style="font-size:0.95em;">${entry.instructor}</div>
                            <div style="font-size:0.95em;">${entry.room}</div>
                        </td>`;
                    }
                });
            } else {
                html += '<td></td>';
            }
        });
        html += '</tr>';
    });
    let footerRow = '<tr><td style="height:0;padding:0;border-top:0;"></td>';
    days.forEach(() => {
        footerRow += '<td style="height:0;padding:0;border-top:0;"></td>';
    });
    footerRow += '</tr>';
    html += footerRow + '</tbody></table>';
    document.getElementById('timetable-container').innerHTML = html;
    // Re-attach delete listeners for the new buttons (if any)
    setTimeout(() => {
        attachDeleteListeners(showScheduler);
    }, 0);
}

// ... existing code ...

function showTeachers() {
    const mainContent = document.getElementById('main-content');
    // Process teachers data to include their specializations
    const teachersWithSubjects = instructors.map(teacher => {
        return {
            name: teacher.name,
            specializations: teacher.specializations || [],
            day: teacher.day || 'Monday - Sunday',
            time: teacher.time || '7:00 am - 7:00 pm'
        };
    });

    let html = `
        <div class="teachers-container">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <h2>Manage Teachers</h2>
                <button class="add-btn" id="add-instructor-btn" style="margin-bottom:0;">Add New Instructor</button>
            </div>
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
                        ${teachersWithSubjects.map((teacher, idx) => `
                            <tr>
                                <td>${teacher.name || ''}</td>
                                <td>${teacher.specializations.length > 0 ? 
                                    teacher.specializations.join(', ') : 
                                    '<span class="no-spec">No specializations</span>'}</td>
                                <td>${teacher.day !== 'Day' ? teacher.day : 'Monday - Sunday'}</td>
                                <td>${teacher.time !== 'Time' ? teacher.time : '7:00 am - 7:00 pm'}</td>
                                <td>
                                    <button class="edit-btn action-btn" data-index="${idx}"><i class="fas fa-edit"></i> Edit</button>
                                    <button class="delete-btn action-btn" data-index="${idx}"><i class="fas fa-trash"></i> Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        <div id="edit-instructor-modal" class="modal" style="display:none;">
            <div class="modal-content" style="max-width:500px;">
                <h3 id="edit-instructor-title">Edit Instructor</h3>
                <form id="edit-instructor-form">
                    <div class="form-group">
                        <label for="instructor-name">Name:</label>
                        <input type="text" id="instructor-name" required>
                    </div>
                    <div class="form-group">
                        <label for="instructor-specializations">Specializations (comma separated):</label>
                        <input type="text" id="instructor-specializations">
                    </div>
                    <div class="form-group">
                        <label for="instructor-day">Available Days:</label>
                        <input type="text" id="instructor-day" placeholder="e.g. Monday - Sunday">
                    </div>
                    <div class="form-group">
                        <label for="instructor-time">Available Time:</label>
                        <input type="text" id="instructor-time" placeholder="e.g. 7:00 am - 7:00 pm">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="primary-btn">Save</button>
                        <button type="button" class="secondary-btn" id="cancel-edit-instructor">Cancel</button>
                    </div>
                </form>
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
            .map((teacher, idx) => `
                <tr>
                    <td>${teacher.name || ''}</td>
                    <td>${teacher.specializations.length > 0 ? 
                        teacher.specializations.join(', ') : 
                        '<span class="no-spec">No specializations</span>'}</td>
                    <td>${teacher.day !== 'Day' ? teacher.day : 'Monday - Sunday'}</td>
                    <td>${teacher.time !== 'Time' ? teacher.time : '7:00 am - 7:00 pm'}</td>
                    <td>
                        <button class="edit-btn action-btn" data-index="${idx}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="delete-btn action-btn" data-index="${idx}"><i class="fas fa-trash"></i> Delete</button>
                    </td>
                </tr>
            `).join('');
        attachEditListeners();
        attachDeleteInstructorListeners();
    }
    searchBtn.addEventListener('click', filterTeachers);
    searchInput.addEventListener('input', filterTeachers);

    // Attach edit listeners
    function attachEditListeners() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.onclick = function() {
                const idx = parseInt(this.getAttribute('data-index'));
                openEditInstructorModal(idx);
            };
        });
    }
    attachEditListeners();

    // Add new instructor button
    document.getElementById('add-instructor-btn').onclick = function() {
        openEditInstructorModal(null);
    };

    // Attach delete listeners
    attachDeleteInstructorListeners();

    // Modal logic
    function openEditInstructorModal(idx) {
        const modal = document.getElementById('edit-instructor-modal');
        const form = document.getElementById('edit-instructor-form');
        const title = document.getElementById('edit-instructor-title');
        if (idx !== null && instructors[idx]) {
            title.textContent = 'Edit Instructor';
            document.getElementById('instructor-name').value = instructors[idx].name || '';
            document.getElementById('instructor-specializations').value = (instructors[idx].specializations || []).join(', ');
            document.getElementById('instructor-day').value = instructors[idx].day || 'Monday - Sunday';
            document.getElementById('instructor-time').value = instructors[idx].time || '7:00 am - 7:00 pm';
        } else {
            title.textContent = 'Add New Instructor';
            document.getElementById('instructor-name').value = '';
            document.getElementById('instructor-specializations').value = '';
            document.getElementById('instructor-day').value = 'Monday - Sunday';
            document.getElementById('instructor-time').value = '7:00 am - 7:00 pm';
        }
        modal.style.display = 'block';
        // Save handler
        form.onsubmit = function(e) {
            e.preventDefault();
            const name = document.getElementById('instructor-name').value.trim();
            const specs = document.getElementById('instructor-specializations').value.split(',').map(s => s.trim()).filter(Boolean);
            const day = document.getElementById('instructor-day').value.trim();
            const time = document.getElementById('instructor-time').value.trim();
            if (!name) return;
            if (idx !== null && instructors[idx]) {
                instructors[idx] = { name, specializations: specs, day, time };
            } else {
                instructors.unshift({ name, specializations: specs, day, time });
            }
            modal.style.display = 'none';
            showTeachers();
        };
        document.getElementById('cancel-edit-instructor').onclick = function() {
            modal.style.display = 'none';
        };
        // Close modal on outside click
        modal.onclick = function(e) {
            if (e.target === modal) modal.style.display = 'none';
        };
    }

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
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <h2>Manage Students</h2>
                <button class="add-btn" id="add-student-btn" style="margin-bottom:0;">Add New Section</button>
            </div>
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
                        ${sections.map((section, idx) => `
                            <tr>
                                <td>${section.course}</td>
                                <td>${section.yearLevel}</td>
                                <td>${section.section}</td>
                                <td>${section.students}</td>
                                <td>
                                    <button class="edit-btn action-btn" data-index="${idx}"><i class="fas fa-edit"></i> Edit</button>
                                    <button class="delete-btn action-btn" data-index="${idx}"><i class="fas fa-trash"></i> Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        <div id="edit-student-modal" class="modal" style="display:none;">
            <div class="modal-content" style="max-width:500px;">
                <h3 id="edit-student-title">Edit Section</h3>
                <form id="edit-student-form">
                    <div class="form-group">
                        <label for="student-course">Course:</label>
                        <input type="text" id="student-course" required>
                    </div>
                    <div class="form-group">
                        <label for="student-year">Year Level:</label>
                        <input type="text" id="student-year" required>
                    </div>
                    <div class="form-group">
                        <label for="student-section">Section:</label>
                        <input type="text" id="student-section" required>
                    </div>
                    <div class="form-group">
                        <label for="student-count">Number of Students:</label>
                        <input type="number" id="student-count" min="1" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="primary-btn">Save</button>
                        <button type="button" class="secondary-btn" id="cancel-edit-student">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    mainContent.innerHTML = html;

    // Search functionality
    const searchInput = document.getElementById('student-search');
    const searchBtn = document.getElementById('student-search-btn');
    const tableBody = document.getElementById('students-table-body');
    function filterStudents() {
        const query = searchInput.value.trim().toLowerCase();
        const filtered = sections
            .filter(section =>
                section.course.toLowerCase().includes(query) ||
                section.yearLevel.toString().toLowerCase().includes(query) ||
                section.section.toLowerCase().includes(query)
            );
        tableBody.innerHTML = filtered
            .map((section, idx) => `
                <tr>
                    <td>${section.course}</td>
                    <td>${section.yearLevel}</td>
                    <td>${section.section}</td>
                    <td>${section.students}</td>
                    <td>
                        <button class="edit-btn action-btn" data-index="${idx}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="delete-btn action-btn" data-index="${idx}"><i class="fas fa-trash"></i> Delete</button>
                    </td>
                </tr>
            `).join('');
        attachEditStudentListeners();
        attachDeleteStudentListeners();
    }
    searchBtn.addEventListener('click', filterStudents);
    searchInput.addEventListener('input', filterStudents);

    function attachEditStudentListeners() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.onclick = function() {
                const idx = parseInt(this.getAttribute('data-index'));
                openEditStudentModal(idx);
            };
        });
    }
    function attachDeleteStudentListeners() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = function() {
                const idx = parseInt(this.getAttribute('data-index'));
                showDeleteModal(() => {
                    sections.splice(idx, 1);
                    showStudents();
                });
            };
        });
    }
    attachEditStudentListeners();
    attachDeleteStudentListeners();

    document.getElementById('add-student-btn').onclick = function() {
        openEditStudentModal(null);
    };

    function openEditStudentModal(idx) {
        const modal = document.getElementById('edit-student-modal');
        const form = document.getElementById('edit-student-form');
        const title = document.getElementById('edit-student-title');
        if (idx !== null && sections[idx]) {
            title.textContent = 'Edit Section';
            document.getElementById('student-course').value = sections[idx].course || '';
            document.getElementById('student-year').value = sections[idx].yearLevel || '';
            document.getElementById('student-section').value = sections[idx].section || '';
            document.getElementById('student-count').value = sections[idx].students || 1;
        } else {
            title.textContent = 'Add New Section';
            document.getElementById('student-course').value = '';
            document.getElementById('student-year').value = '';
            document.getElementById('student-section').value = '';
            document.getElementById('student-count').value = 1;
        }
        modal.style.display = 'block';
        form.onsubmit = function(e) {
            e.preventDefault();
            const course = document.getElementById('student-course').value.trim();
            const yearLevel = document.getElementById('student-year').value.trim();
            const section = document.getElementById('student-section').value.trim();
            const students = parseInt(document.getElementById('student-count').value);
            if (!course || !yearLevel || !section || !students) return;
            if (idx !== null && sections[idx]) {
                sections[idx] = { course, yearLevel, section, students };
            } else {
                sections.unshift({ course, yearLevel, section, students });
            }
            modal.style.display = 'none';
            showStudents();
        };
        document.getElementById('cancel-edit-student').onclick = function() {
            modal.style.display = 'none';
        };
        modal.onclick = function(e) {
            if (e.target === modal) modal.style.display = 'none';
        };
    }
    animateMainContent();
}

function showRooms() {
    const mainContent = document.getElementById('main-content');
    let html = `
        <div class="rooms-container">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <h2>Manage Rooms</h2>
                <button class="add-btn" id="add-room-btn" style="margin-bottom:0;">Add New Room</button>
            </div>
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
                        ${rooms.map((room, idx) => `
                            <tr>
                                <td>${room.name}</td>
                                <td>${room.capacity}</td>
                                <td>${room.availability.days.join(', ')}</td>
                                <td>${room.availability.time}</td>
                                <td>
                                    <button class="edit-btn action-btn" data-index="${idx}"><i class="fas fa-edit"></i> Edit</button>
                                    <button class="delete-btn action-btn" data-index="${idx}"><i class="fas fa-trash"></i> Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        <div id="edit-room-modal" class="modal" style="display:none;">
            <div class="modal-content" style="max-width:500px;">
                <h3 id="edit-room-title">Edit Room</h3>
                <form id="edit-room-form">
                    <div class="form-group">
                        <label for="room-name">Room Name:</label>
                        <input type="text" id="room-name" required>
                    </div>
                    <div class="form-group">
                        <label for="room-capacity">Capacity:</label>
                        <input type="number" id="room-capacity" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="room-days">Available Days (comma separated):</label>
                        <input type="text" id="room-days" required>
                    </div>
                    <div class="form-group">
                        <label for="room-time">Available Time:</label>
                        <input type="text" id="room-time" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="primary-btn">Save</button>
                        <button type="button" class="secondary-btn" id="cancel-edit-room">Cancel</button>
                    </div>
                </form>
            </div>
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
            .map((room, idx) => `
                <tr>
                    <td>${room.name}</td>
                    <td>${room.capacity}</td>
                    <td>${room.availability.days.join(', ')}</td>
                    <td>${room.availability.time}</td>
                    <td>
                        <button class="edit-btn action-btn" data-index="${idx}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="delete-btn action-btn" data-index="${idx}"><i class="fas fa-trash"></i> Delete</button>
                    </td>
                </tr>
            `).join('');
        attachEditRoomListeners();
        attachDeleteRoomListeners();
    }
    searchBtn.addEventListener('click', filterRooms);
    searchInput.addEventListener('input', filterRooms);

    function attachEditRoomListeners() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.onclick = function() {
                const idx = parseInt(this.getAttribute('data-index'));
                openEditRoomModal(idx);
            };
        });
    }
    function attachDeleteRoomListeners() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = function() {
                const idx = parseInt(this.getAttribute('data-index'));
                showDeleteModal(() => {
                    rooms.splice(idx, 1);
                    showRooms();
                });
            };
        });
    }
    attachEditRoomListeners();
    attachDeleteRoomListeners();

    document.getElementById('add-room-btn').onclick = function() {
        openEditRoomModal(null);
    };

    function openEditRoomModal(idx) {
        const modal = document.getElementById('edit-room-modal');
        const form = document.getElementById('edit-room-form');
        const title = document.getElementById('edit-room-title');
        if (idx !== null && rooms[idx]) {
            title.textContent = 'Edit Room';
            document.getElementById('room-name').value = rooms[idx].name || '';
            document.getElementById('room-capacity').value = rooms[idx].capacity || 1;
            document.getElementById('room-days').value = rooms[idx].availability.days.join(', ') || '';
            document.getElementById('room-time').value = rooms[idx].availability.time || '';
        } else {
            title.textContent = 'Add New Room';
            document.getElementById('room-name').value = '';
            document.getElementById('room-capacity').value = 1;
            document.getElementById('room-days').value = '';
            document.getElementById('room-time').value = '';
        }
        modal.style.display = 'block';
        form.onsubmit = function(e) {
            e.preventDefault();
            const name = document.getElementById('room-name').value.trim();
            const capacity = parseInt(document.getElementById('room-capacity').value);
            const days = document.getElementById('room-days').value.split(',').map(d => d.trim()).filter(Boolean);
            const time = document.getElementById('room-time').value.trim();
            if (!name || !capacity || !days.length || !time) return;
            if (idx !== null && rooms[idx]) {
                rooms[idx] = { name, capacity, availability: { days, time } };
            } else {
                rooms.unshift({ name, capacity, availability: { days, time } });
            }
            modal.style.display = 'none';
            showRooms();
        };
        document.getElementById('cancel-edit-room').onclick = function() {
            modal.style.display = 'none';
        };
        modal.onclick = function(e) {
            if (e.target === modal) modal.style.display = 'none';
        };
    }
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
        '1:30 am - 2:00 pm',
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
                            <th>Saturday</th>
                            <th>Sunday</th>
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
                                <td id="saturday-${time.replace(/[:\s]/g, '')}-instructor"></td>
                                <td id="sunday-${time.replace(/[:\s]/g, '')}-instructor"></td>
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
                            <option value="Saturday">Saturday</option>
                            <option value="Sunday">Sunday</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="instructor-manual-time">Time Slot:</label>
                        <select id="instructor-manual-time" required>
                            ${[
                                '7:00 am - 7:30 am','7:30 am - 8:00 am','8:00 am - 8:30 am','8:30 am - 9:00 am','9:00 am - 9:30 am','9:30 am - 10:00 am','10:00 am - 10:30 am','10:30 am - 11:00 am','11:00 am - 11:30 am','11:30 am - 12:00 pm','12:00 pm - 12:30 pm','12:30 pm - 1:00 pm','1:00 pm - 1:30 pm','1:30 pm - 2:00 pm','2:00 pm - 2:30 pm','2:30 pm - 3:00 pm','3:00 pm - 3:30 pm','3:30 pm - 4:00 pm','4:00 pm - 4:30 pm','4:30 pm - 5:00 pm','5:00 pm - 5:30 pm','5:30 pm - 6:00 pm','6:00 pm - 6:30 pm','6:30 pm - 7:00 pm', '7:00 pm - 7:30 pm', '7:30 pm - 8:00 pm', '8:00 pm - 8:30 pm', '8:30 pm - 9:00 pm', '9:00 pm - 9:30 pm', '9:30 pm - 10:00 pm', '10:00 pm - 10:30 pm', '10:30 pm - 11:00 pm', '11:00 pm - 11:30 pm', '11:30 pm - 12:00 am', '12:00 am - 12:30 am', '12:30 am - 1:00 am', '1:00 am - 1:30 am', '1:30 am - 2:00 am', '2:00 am - 2:30 am', '2:30 am - 3:00 am', '3:00 am - 3:30 am', '3:30 am - 4:00 am', '4:00 am - 4:30 am', '4:30 am - 5:00 am', '5:00 am - 5:30 am', '5:30 am - 6:00 am', '6:00 am - 6:30 am', '6:30 am - 7:00 am'
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
                <div class="class-block" style="background:${color};color:#fff;position:relative;">
                    <button class='delete-class-btn' title='Delete' data-section='${schedule.section}' data-subject='${schedule.subject}' data-day='${schedule.day}' data-slot='${schedule.slot}' style='position:absolute;top:4px;right:4px;width:22px;height:22px;border:none;border-radius:50%;background:#e74c3c;color:#fff;font-size:1.1em;line-height:1;cursor:pointer;z-index:2;display:flex;align-items:center;justify-content:center;padding:0;'>&times;</button>
                    <div style="font-weight:700;font-size:1.1em;">${schedule.subject}</div>
                    <div style="font-size:0.95em;">${schedule.subjectCode}</div>
                    <div style="font-size:0.95em;">${schedule.instructor}</div>
                    <div style="font-size:0.95em;">${schedule.room}</div>
                    </div>
            `;
        }
    });
    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-class-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const section = this.getAttribute('data-section');
            const subject = this.getAttribute('data-subject');
            const day = this.getAttribute('data-day');
            const slot = this.getAttribute('data-slot');
            // Remove from generatedSectionSchedule
            if (window.generatedSectionSchedule) {
                window.generatedSectionSchedule = window.generatedSectionSchedule.filter(
                    sched => !(sched.section === section && sched.subject === subject && sched.day === day && sched.slots.includes(slot))
                );
            }
            // Remove from schedules
            if (window.schedules) {
                window.schedules = window.schedules.filter(
                    sched => !(sched.section === section && sched.subject === subject && sched.day === day && sched.slots.includes(slot))
                );
            }
            // Refresh the view using the currently selected instructor
            const currentInstructor = document.getElementById('instructor-select')?.value || instructorName;
            populateInstructorSchedule(currentInstructor);
        });
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
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
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
function generateSectionBasedSchedule(filteredSections = null) {
    const subjectInstructorMap = {};
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
    const maxBlockSize = 3;
    const filteredTimes = times.filter(slot => !isLunchBreak(slot));
    const sectionInstructorMap = {};
    if (!window.subjectGroups) {
        console.warn('No subject groups loaded.');
        return;
    }
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    // Use only the provided sections, or all if not provided
    const sectionsToProcess = filteredSections || sections;
    let sectionCodes = sectionsToProcess.map(s => s.section);
    let sectionSubjects = {};
    // Map each section to the correct subject group by matching course and yearLevel (robust)
    // --- Begin full original scheduling logic, but use sectionsToProcess instead of sections ---
    for (const sec of sectionCodes) {
        const sectionObj = sectionsToProcess.find(s => s.section === sec);
        // --- Improved matching logic ---
        let foundGroup = null;
        if (window.subjectGroups[sec]) {
            foundGroup = sec;
        } else {
            let sectionParts = sectionObj.section.split('-');
            let courseCode = sectionParts[0];
            let yearNum = 1;
            if (sectionParts[1]) {
                let yearMatch = sectionParts[1].match(/(\d+)/);
                if (yearMatch) yearNum = parseInt(yearMatch[1], 10);
            }
            let yearOrdinal = getYearOrdinal(yearNum);
            const normalize = str => (str || '').replace(/\s+/g, '').toLowerCase();
            for (const groupKey of Object.keys(window.subjectGroups)) {
                const normKey = normalize(groupKey);
                if (
                    (normKey.includes(normalize(courseCode)) && normKey.includes(normalize(yearOrdinal) + 'year')) ||
                    (normKey.includes(normalize(courseCode)) && normKey.includes(yearNum + 'year'))
                ) {
                    foundGroup = groupKey;
                    break;
                }
            }
            if (!foundGroup) {
                for (const groupKey of Object.keys(window.subjectGroups)) {
                    if (normalize(groupKey).includes(normalize(courseCode))) {
                        foundGroup = groupKey;
                        break;
                    }
                }
            }
            if (!foundGroup && courseCode.length > 3) {
                const partial = normalize(courseCode).slice(0, 4);
                for (const groupKey of Object.keys(window.subjectGroups)) {
                    if (normalize(groupKey).includes(partial)) {
                        foundGroup = groupKey;
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
            const isMajor = isMajorSubject(subj.code, sectionObj.course);
            subjectSlotsRemaining[subj.code] = isMajor ? 6 : (subj.credit ? Math.round(subj.credit * 2) : 2);
        });
        for (const subj of subjects) {
            let slotsLeft = subjectSlotsRemaining[subj.code];
            let totalScheduled = 0;
            const isNSTP = subj.code && subj.code.toUpperCase().includes('NSTP');
            const isMajor = isMajorSubject(subj.code, sectionObj.course);
            const year = parseInt(sectionObj.yearLevel);
            const allowedDays = isNSTP ? ['Saturday', 'Sunday'] : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            if (isNSTP) {
                let scheduled = false;
                const nstpDay = 'Saturday';
                const nstpSlots = subj.credit === 2 ? 4 : 6;
                let slotsLeft = nstpSlots;
                let totalScheduled = 0;
                const timeSlotsOrdered = filteredTimes;
                let blockScheduled = false;
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
                    const studentCount = (sectionsToProcess.find(s => s.section === sec)?.students) || 0;
                    const availableRooms = findSuitableRooms(studentCount, subj).filter(room => {
                        const building = (room.name.split(' ')[0] || '').toUpperCase();
                        const usedBuildings = window.nstpUsedBuildings[slotRange[0]] || new Set();
                        return !usedBuildings.has(building);
                    });
                    const room = availableRooms.length > 0 ? availableRooms[0] : null;
                    if (!room) continue;
                    const slotKey = slotRange.join('|');
                    if (window.nstpUsedTimeSlots[slotKey]) continue;
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
                        const studentCount = (sectionsToProcess.find(s => s.section === sec)?.students) || 0;
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
                let scheduledBlocks = 0;
                let preferredInstructor = null;
                if (!sectionProfessors[sec]) sectionProfessors[sec] = new Set();
                if (!subjectInstructorMap[sec]) subjectInstructorMap[sec] = {};
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
                                let instructorConflict = false;
                                for (const slot of slotRange) {
                                    if (teacherAssignments[preferredInstructor.name] && teacherAssignments[preferredInstructor.name][day] && teacherAssignments[preferredInstructor.name][day][slot]) {
                                        instructorConflict = true;
                                        break;
                                    }
                                }
                                if (instructorConflict) continue;
                                const studentCount = (sectionsToProcess.find(s => s.section === sec)?.students) || 0;
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
                                    let instructorConflict = false;
                                    for (const slot of slotRange) {
                                        if (teacherAssignments[instructor.name] && teacherAssignments[instructor.name][day] && teacherAssignments[instructor.name][day][slot]) {
                                            instructorConflict = true;
                                            break;
                                        }
                                    }
                                    if (instructorConflict) continue;
                                    const studentCount = (sectionsToProcess.find(s => s.section === sec)?.students) || 0;
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
                            const studentCount = (sectionsToProcess.find(s => s.section === sec)?.students) || 0;
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
    window.generatedSectionSchedule = schedule;
    schedules = schedule;
    if (typeof showScheduler === 'function') showScheduler();
}

function generateSectionBasedScheduleFiltered(filteredSections) {
    generateSectionBasedSchedule(filteredSections);
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

    // Add a global confirmation modal for delete actions if not present
    function ensureDeleteModal() {
        if (document.getElementById('delete-confirm-modal')) return;
        const modalHtml = `
            <div id="delete-confirm-modal" class="modal" style="display:none;z-index:2000;">
                <div class="modal-content" style="max-width:340px;text-align:center;">
                    <h3 style="margin-bottom:18px;">Confirm Delete</h3>
                    <div style="margin-bottom:24px;">Are you sure you want to delete this schedule entry?</div>
                    <div class="form-actions" style="justify-content:center;gap:18px;">
                        <button id="delete-confirm-yes" class="primary-btn" style="background:#e74c3c;">Delete</button>
                        <button id="delete-confirm-no" class="secondary-btn">Cancel</button>
            </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    function showDeleteModal(onConfirm) {
        ensureDeleteModal();
        const modal = document.getElementById('delete-confirm-modal');
        modal.style.display = 'block';
        // Remove previous listeners
        const yesBtn = document.getElementById('delete-confirm-yes');
        const noBtn = document.getElementById('delete-confirm-no');
        yesBtn.onclick = function() {
            modal.style.display = 'none';
            onConfirm();
        };
        noBtn.onclick = function() {
            modal.style.display = 'none';
        };
        // Also close modal on outside click
        modal.onclick = function(e) {
            if (e.target === modal) modal.style.display = 'none';
        };
    }

    // Patch all delete-class-btn event listeners to use the modal
    function attachDeleteListeners(contextRefreshFn) {
        document.querySelectorAll('.delete-class-btn').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation();
                const section = this.getAttribute('data-section');
                const subject = this.getAttribute('data-subject');
                const day = this.getAttribute('data-day');
                const slot = this.getAttribute('data-slot');
                showDeleteModal(() => {
                    // Remove from generatedSectionSchedule
                    if (window.generatedSectionSchedule) {
                        window.generatedSectionSchedule = window.generatedSectionSchedule.filter(
                            sched => !(sched.section === section && sched.subject === subject && sched.day === day && sched.slots.includes(slot))
                        );
                    }
                    // Remove from schedules
                    if (window.schedules) {
                        window.schedules = window.schedules.filter(
                            sched => !(sched.section === section && sched.subject === subject && sched.day === day && sched.slots.includes(slot))
                        );
                    }
                    // Refresh the view
                    contextRefreshFn();
                });
            };
        });
    }

    // ... existing code ...
    // In showScheduler, after rendering, call:
    setTimeout(() => {
        attachDeleteListeners(showScheduler);
    }, 0);
    // ... existing code ...
    // In populateInstructorSchedule, after rendering, call:
    attachDeleteListeners(() => {
        const currentInstructor = document.getElementById('instructor-select')?.value || instructorName;
        populateInstructorSchedule(currentInstructor);
    });
    // ... existing code ...

    // After attachEditListeners();
    function attachDeleteInstructorListeners() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = function() {
                const idx = parseInt(this.getAttribute('data-index'));
                showDeleteModal(() => {
                    instructors.splice(idx, 1);
                    showTeachers();
                });
            };
        });
    }
    attachDeleteInstructorListeners();
    // ... existing code ...
    // After filterTeachers() update:
    attachEditListeners();
    attachDeleteInstructorListeners();
    // ... existing code ...

    // Add a global modal for generation success if not present
    function ensureGenerationModal() {
        if (document.getElementById('generation-success-modal')) return;
        const modalHtml = `
            <div id="generation-success-modal" class="modal" style="display:none;z-index:2000;">
                <div class="modal-content" style="max-width:340px;text-align:center;">
                    <h3 id="generation-success-title" style="margin-bottom:18px;">Success</h3>
                    <div id="generation-success-message" style="margin-bottom:24px;"></div>
                    <div class="form-actions" style="justify-content:center;gap:18px;">
                        <button id="generation-success-ok" class="primary-btn">OK</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.getElementById('generation-success-ok').onclick = function() {
            document.getElementById('generation-success-modal').style.display = 'none';
        };
        document.getElementById('generation-success-modal').onclick = function(e) {
            if (e.target === this) this.style.display = 'none';
        };
    }
    function showGenerationModal(message, title = 'Success') {
        ensureGenerationModal();
        document.getElementById('generation-success-title').textContent = title;
        document.getElementById('generation-success-message').textContent = message;
        document.getElementById('generation-success-modal').style.display = 'block';
    }

    // Restore exportAsImage and exportAsPDF functions
    async function exportAsImage() {
        const timetableContainer = document.getElementById('timetable-container');
        const section = document.getElementById('section-sched-select')?.value || '';
        try {
            const canvas = await html2canvas(timetableContainer, {
                scale: 2,
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
        const section = document.getElementById('section-sched-select')?.value || '';
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

    // Add a reusable warning modal
    function ensureWarningModal() {
        if (document.getElementById('warning-modal')) return;
        const modalHtml = `
            <div id="warning-modal" class="modal" style="display:none;z-index:2100;">
                <div class="modal-content" style="max-width:340px;text-align:center;">
                    <h3 style="margin-bottom:18px;">Warning</h3>
                    <div id="warning-message" style="margin-bottom:24px;"></div>
                    <div class="form-actions" style="justify-content:center;gap:18px;">
                        <button id="warning-ok" class="primary-btn">OK</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.getElementById('warning-ok').onclick = function() {
            document.getElementById('warning-modal').style.display = 'none';
        };
        document.getElementById('warning-modal').onclick = function(e) {
            if (e.target === this) this.style.display = 'none';
        };
    }
    function showWarningModal(message) {
        ensureWarningModal();
        document.getElementById('warning-message').textContent = message;
        document.getElementById('warning-modal').style.display = 'block';
    }