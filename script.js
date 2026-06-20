// 선생님께서 담당하시는 실제 학생 명단 등록창
const mockRoster = {
    "1반": ["10101 김가은", "10102 나지훈", "10103 다민수", "10104 라정우", "10105 마유리"],
    "2반": ["10201 박지성", "10202 손흥민", "10203 김연아", "10204 이강인"],
    "3반": ["10301 사지우", "10302 아현우", "10303 차은우"]
};

// 브라우저 로컬 저장소로부터 저장 데이터 호출
let submissions = JSON.parse(localStorage.getItem('scienceJournalCardNews')) || [];
let currentTeacherClass = "1반";

// 상단 메뉴 전환 스크립트
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-card').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabName + '-section').classList.add('active');
    document.getElementById('btn-' + tabName).classList.add('active');

    if(tabName === 'teacher') {
        initTeacherDashboard();
    }
}

// 학생 수업 일지 제출 시 데이터 처리
document.getElementById('journal-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const data = {
        classRoom: document.getElementById('student-class').value,
        studentId: document.getElementById('student-id').value.trim(),
        studentName: document.getElementById('student-name').value.trim(),
        unit: document.getElementById('science-unit').value,
        impression: document.getElementById('q-impression').value.trim(),
        difficulty: document.getElementById('q-difficulty').value.trim(),
        learned: document.getElementById('q-learned').value.trim(),
        wellDone: document.getElementById('q-welldone').value.trim(),
        resolution: document.getElementById('q-resolution').value.trim(),
        timestamp: new Date().toLocaleString('ko-KR')
    };

    // 중복으로 등록된 데이터 판정 및 덮어쓰기 여부 확인
    const existingIndex = submissions.findIndex(s => s.studentId === data.studentId);
    if(existingIndex >= 0) {
        if(confirm("해당 학번으로 제출된 기록이 존재합니다. 내용을 새롭게 수정하시겠습니까?")) {
            submissions[existingIndex] = data;
        } else {
            return;
        }
    } else {
        submissions.push(data);
    }

    // 로컬 스토리지 데이터 동기화
    localStorage.setItem('scienceJournalCardNews', JSON.stringify(submissions));
    
    alert("🌌 일지가 소라선생님께 전달되었습니다. 오늘도 멋지게 성장했네요!");
    this.reset();
});

// 관리자 학급 탭 렌더링
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

// 학급별 대시보드 리스트 및 표 업데이트
function renderClassData(className) {
    document.getElementById('current-class-title').innerText = className;
    const classSubmissions = submissions.filter(s => s.classRoom === className);
    const roster = mockRoster[className] || [];
    
    const submittedList = [];
    const unsubmittedList = [];

    // 배정 명단 대조 작업 수행
    roster.forEach(studentInfo => {
        const stdId = studentInfo.split(' ')[0]; // 공백 기준으로 학번 파싱
        const hasSubmitted = classSubmissions.some(s => s.studentId === stdId);
        
        if(hasSubmitted) {
            submittedList.push(studentInfo);
        } else {
            unsubmittedList.push(studentInfo);
        }
    });

    // 현황판 바인딩
    document.getElementById('list-submitted').innerHTML = submittedList.map(s => `<li>${s}</li>`).join('');
    document.getElementById('count-sub').innerText = submittedList.length;

    document.getElementById('list-unsubmitted').innerHTML = unsubmittedList.map(s => `<li>${s}</li>`).join('');
    document.getElementById('count-unsub').innerText = unsubmittedList.length;

    // 테이블 행 데이터 초기화 및 바인딩
    const tbody = document.getElementById('responses-body');
    tbody.innerHTML = '';
    
    if (classSubmissions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #a0aec0; padding: 30px;">제출된 일지 내용이 아직 없습니다.</td></tr>`;
        return;
    }

    classSubmissions.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 500; color: #4a00e0;">${s.studentId}</td>
            <td style="font-weight: 500;">${s.studentName}</td>
            <td><span class="badge" style="background:#e2e8f0; color:#4a5568;">${s.unit}</span></td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;" title="${s.impression}">${s.impression}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;" title="${s.difficulty}">${s.difficulty}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;" title="${s.learned}">${s.learned}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;" title="${s.wellDone}">${s.wellDone}</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; font-style: italic;" title="${s.resolution}">${s.resolution}</td>
            <td style="font-size: 0.8rem; color:#a0aec0;">${s.timestamp}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 엑셀 내보내기(CSV) 스크립트 기동
function downloadCSV() {
    const classSubmissions = submissions.filter(s => s.classRoom === currentTeacherClass);
    if(classSubmissions.length === 0) {
        alert("현재 반에 다운로드 가능한 학생 데이터가 없습니다.");
        return;
    }

    let csvContent = "학번,이름,단원,인상 깊은 내용,어려웠던 점,더 알게 된 점,잘한 점,나의 다짐,제출일시\n";

    classSubmissions.forEach(s => {
        const row = [
            s.studentId, s.studentName, s.unit,
            s.impression, s.difficulty, s.learned, s.wellDone, s.resolution, s.timestamp
        ].map(text => `"${String(text).replace(/"/g, '""')}"`).join(',');
        
        csvContent += row + "\n";
    });

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `[과학수업일지]_${currentTeacherClass}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 전체 데이터 청소
function clearData() {
    if(confirm("🚨 경고: 저장소 내의 모든 반 학생들의 누적 제출 정보가 전부 영구 삭제됩니다. 진행하시겠습니까?")) {
        localStorage.removeItem('scienceJournalCardNews');
        submissions = [];
        initTeacherDashboard();
        alert("데이터 초기화가 완료되었습니다.");
    }
}
