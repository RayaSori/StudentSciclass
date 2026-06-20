// 선생님께서 실제 담당하시는 반과 학생들의 학번/이름을 여기에 등록해 주세요.
// 이 명단(mockRoster)을 기준으로 미제출자를 걸러냅니다.
const mockRoster = {
    "1반": ["10101 김가은", "10102 나지훈", "10103 다민수"],
    "2반": ["10201 라영희", "10202 마철수", "10203 바보람"],
    "3반": ["10301 사지우", "10302 아현우"]
};

// 제출된 데이터를 저장할 배열 (로컬 스토리지에서 불러오기)
let submissions = JSON.parse(localStorage.getItem('scienceJournal')) || [];
let currentTeacherClass = "1반";

// 화면 탭 전환 함수 (학생용 / 교사용)
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabName + '-section').classList.add('active');
    document.getElementById('btn-' + tabName).classList.add('active');

    if(tabName === 'teacher') {
        initTeacherDashboard();
    }
}

// 폼 제출 이벤트
document.getElementById('journal-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const data = {
        classRoom: document.getElementById('student-class').value,
        studentId: document.getElementById('student-id').value,
        studentName: document.getElementById('student-name').value,
        unit: document.getElementById('science-unit').value,
        impression: document.getElementById('q-impression').value,
        difficulty: document.getElementById('q-difficulty').value,
        learned: document.getElementById('q-learned').value,
        wellDone: document.getElementById('q-welldone').value,
        resolution: document.getElementById('q-resolution').value,
        timestamp: new Date().toLocaleString('ko-KR')
    };

    // 중복 제출 확인 (같은 학번이 이미 제출했는지)
    const existingIndex = submissions.findIndex(s => s.studentId === data.studentId);
    if(existingIndex >= 0) {
        if(confirm("이미 제출한 기록이 있습니다. 덮어쓰시겠습니까?")) {
            submissions[existingIndex] = data;
        } else {
            return;
        }
    } else {
        submissions.push(data);
    }

    // 로컬 스토리지에 저장
    localStorage.setItem('scienceJournal', JSON.stringify(submissions));
    
    alert("일지가 성공적으로 제출되었습니다. 참 잘했어요! 👏");
    this.reset();
});

// 교사 대시보드 초기화
function initTeacherDashboard() {
    const classTabsDiv = document.getElementById('class-tabs');
    classTabsDiv.innerHTML = '';

    Object.keys(mockRoster).forEach(className => {
        const btn = document.createElement('button');
        btn.innerText = className;
        if(className === currentTeacherClass) btn.classList.add('active');
        btn.onclick = () => {
            currentTeacherClass = className;
            initTeacherDashboard();
        };
        classTabsDiv.appendChild(btn);
    });

    renderClassData(currentTeacherClass);
}

// 선택된 학급의 데이터 렌더링 (제출자/미제출자/테이블)
function renderClassData(className) {
    const classSubmissions = submissions.filter(s => s.classRoom === className);
    const roster = mockRoster[className] || [];
    
    const submittedList = [];
    const unsubmittedList = [];

    // 명단을 기준으로 제출/미제출 분류
    roster.forEach(studentInfo => {
        const stdId = studentInfo.split(' ')[0]; // 학번 추출
        const hasSubmitted = classSubmissions.some(s => s.studentId === stdId);
        
        if(hasSubmitted) {
            submittedList.push(studentInfo);
        } else {
            unsubmittedList.push(studentInfo);
        }
    });

    // 화면에 리스트 반영
    document.getElementById('list-submitted').innerHTML = submittedList.map(s => `<li>${s}</li>`).join('');
    document.getElementById('count-sub').innerText = submittedList.length;

    document.getElementById('list-unsubmitted').innerHTML = unsubmittedList.map(s => `<li>${s}</li>`).join('');
    document.getElementById('count-unsub').innerText = unsubmittedList.length;

    // 테이블 렌더링
    const tbody = document.getElementById('responses-body');
    tbody.innerHTML = '';
    classSubmissions.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.studentId}</td>
            <td>${s.studentName}</td>
            <td>${s.unit}</td>
            <td>${s.impression}</td>
            <td>${s.difficulty}</td>
            <td>${s.learned}</td>
            <td>${s.wellDone}</td>
            <td>${s.resolution}</td>
            <td>${s.timestamp}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 엑셀(CSV) 다운로드 기능
function downloadCSV() {
    const classSubmissions = submissions.filter(s => s.classRoom === currentTeacherClass);
    if(classSubmissions.length === 0) {
        alert("다운로드할 데이터가 없습니다.");
        return;
    }

    // CSV 헤더
    let csvContent = "학번,이름,단원,인상 깊은 내용,어려웠던 점,더 알게 된 점,잘한 점,나의 다짐,제출일시\n";

    classSubmissions.forEach(s => {
        // 쉼표나 줄바꿈이 있는 내용을 위한 처리
        const row = [
            s.studentId, s.studentName, s.unit,
            s.impression, s.difficulty, s.learned, s.wellDone, s.resolution, s.timestamp
        ].map(text => `"${String(text).replace(/"/g, '""')}"`).join(',');
        
        csvContent += row + "\n";
    });

    // 한글 깨짐 방지 (BOM 추가)
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `과학일지_${currentTeacherClass}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 데이터 초기화 기능
function clearData() {
    if(confirm("정말로 모든 학생의 제출 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
        localStorage.removeItem('scienceJournal');
        submissions = [];
        initTeacherDashboard();
        alert("초기화 되었습니다.");
    }
}
