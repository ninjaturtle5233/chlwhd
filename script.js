// 전역 변수
const ACCOUNT_COUNT = 6; // 계정 수를 6개로 확장
let accounts = {};
let volumeLevel = 50; // 기본 볼륨 레벨 (%)

// 초기화 함수
function initializeApp() {
    // 볼륨 컨트롤 초기화
    const volumeControl = document.getElementById('volume-control');
    const volumeValue = document.getElementById('volume-value');
    
    volumeControl.addEventListener('input', function() {
        volumeLevel = this.value;
        volumeValue.textContent = `${volumeLevel}%`;
    });
    
    // 소리 테스트 버튼 이벤트 리스너
    document.getElementById('test-sound').addEventListener('click', function() {
        playAlertSound();
        addLogEntry('알림 소리 테스트');
    });
    
    // 각 계정 초기화
    for (let i = 1; i <= ACCOUNT_COUNT; i++) {
        initializeAccount(i);
    }
    
    // 로그 추가
    addLogEntry('시스템 시작');
    addLogEntry('정확한 시간 측정을 위해 performance.now() API를 사용합니다.');
    
    // 소리 테스트
    setTimeout(() => {
        playAlertSound();
        addLogEntry('시작 시 소리 테스트 실행');
    }, 2000);
}

// 소리 재생 함수 - 브라우저 내장 알림 소리 사용 (부드러운 소리로 변경, 1초 재생)
function playAlertSound() {
    try {
        // 브라우저 내장 알림 소리 생성
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        // 볼륨 설정 (기본값보다 낮게 설정)
        gainNode.gain.value = (volumeLevel / 100) * 0.3; // 볼륨을 30% 낮춤
        
        // 소리 설정 (부드러운 사인파로 변경)
        oscillator.type = 'sine'; // 사인파 (부드러운 소리)
        oscillator.frequency.setValueAtTime(440, context.currentTime); // A4 음 (더 낮은 주파수)
        
        // 연결 및 재생
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        // 소리 재생 시작
        oscillator.start();
        
        // 1초 후 소리 중지 (사용자 요청에 따라 변경)
        setTimeout(() => {
            oscillator.stop();
            addLogEntry('알림 소리 재생 완료');
        }, 1000);
        
        // 로그 추가
        addLogEntry('알림 소리 재생 시작');
    } catch (error) {
        console.error('소리 재생 실패:', error);
        addLogEntry('알림 소리 재생 실패: ' + error.message);
        
        // 대체 방법: 브라우저 beep 함수 사용
        try {
            window.navigator.vibrate(200); // 모바일 기기에서 진동 (지원 시)
        } catch (e) {
            console.log('진동 기능 지원하지 않음');
        }
        
        // 알림 표시
        showNotification('알림: 휴식 시간입니다!');
    }
}

// 계정 초기화 함수
function initializeAccount(accountNumber) {
    const accountId = `account${accountNumber}`;
    
    // 계정 객체 생성
    accounts[accountId] = {
        isRunning: false,
        startTime: 0,
        totalTime: 0,
        sessionTime: 0,
        lastUpdateTime: 0, // 마지막 업데이트 시간 추가
        goalTime: parseInt(document.getElementById(`${accountId}-goal-time`).value) * 60 * 60 * 1000, // 시간 -> 밀리초
        intervalTime: parseInt(document.getElementById(`${accountId}-interval-time`).value) * 60 * 1000, // 분 -> 밀리초
        restTime: parseInt(document.getElementById(`${accountId}-rest-time`).value) * 60 * 1000, // 분 -> 밀리초
        nextRestTime: parseInt(document.getElementById(`${accountId}-interval-time`).value) * 60 * 1000, // 분 -> 밀리초
        isResting: false,
        restStartTime: 0,
        restElapsedTime: 0,
        timerId: null,
        restTimerId: null
    };
    
    // 목표 시간 입력 이벤트 리스너
    document.getElementById(`${accountId}-goal-time`).addEventListener('change', function() {
        const goalHours = parseInt(this.value);
        accounts[accountId].goalTime = goalHours * 60 * 60 * 1000; // 시간 -> 밀리초
        document.getElementById(`${accountId}-goal-display`).textContent = goalHours;
        document.getElementById(`${accountId}-remaining`).textContent = formatTime(accounts[accountId].goalTime - accounts[accountId].totalTime);
        updateProgressBar(accountId);
    });
    
    // 휴식 알림 간격 입력 이벤트 리스너
    document.getElementById(`${accountId}-interval-time`).addEventListener('change', function() {
        const intervalMinutes = parseInt(this.value);
        accounts[accountId].intervalTime = intervalMinutes * 60 * 1000; // 분 -> 밀리초
        if (!accounts[accountId].isRunning) {
            accounts[accountId].nextRestTime = accounts[accountId].intervalTime;
            document.getElementById(`${accountId}-next-rest`).textContent = formatTime(accounts[accountId].nextRestTime);
        }
    });
    
    // 휴식 시간 입력 이벤트 리스너
    document.getElementById(`${accountId}-rest-time`).addEventListener('change', function() {
        const restMinutes = parseInt(this.value);
        accounts[accountId].restTime = restMinutes * 60 * 1000; // 분 -> 밀리초
    });
    
    // 시작 버튼 이벤트 리스너
    document.getElementById(`${accountId}-start`).addEventListener('click', function() {
        startTimer(accountId);
    });
    
    // 종료 버튼 이벤트 리스너
    document.getElementById(`${accountId}-stop`).addEventListener('click', function() {
        stopTimer(accountId);
    });
    
    // 초기화 버튼 이벤트 리스너
    document.getElementById(`${accountId}-reset`).addEventListener('click', function() {
        resetTimer(accountId);
    });
    
    // 알림 확인 버튼 이벤트 리스너
    document.getElementById('notification-close').addEventListener('click', function() {
        document.getElementById('notification').style.display = 'none';
    });
    
    // 초기 표시 업데이트
    document.getElementById(`${accountId}-goal-display`).textContent = accounts[accountId].goalTime / (60 * 60 * 1000);
    document.getElementById(`${accountId}-total`).textContent = formatTime(accounts[accountId].totalTime);
    document.getElementById(`${accountId}-remaining`).textContent = formatTime(accounts[accountId].goalTime);
    document.getElementById(`${accountId}-session`).textContent = formatTime(accounts[accountId].sessionTime);
    document.getElementById(`${accountId}-next-rest`).textContent = formatTime(accounts[accountId].nextRestTime);
}

// 타이머 시작 함수
function startTimer(accountId) {
    if (accounts[accountId].isResting) {
        return;
    }
    
    if (!accounts[accountId].isRunning) {
        accounts[accountId].isRunning = true;
        const now = performance.now();
        accounts[accountId].startTime = now - accounts[accountId].sessionTime;
        accounts[accountId].lastUpdateTime = now; // 마지막 업데이트 시간 설정
        
        // 버튼 상태 업데이트
        document.getElementById(`${accountId}-start`).disabled = true;
        document.getElementById(`${accountId}-stop`).disabled = false;
        
        // 상태 업데이트
        document.getElementById(`${accountId}-status`).textContent = '실행 중';
        
        // 타이머 시작
        accounts[accountId].timerId = setInterval(function() {
            updateTimer(accountId);
        }, 1000);
        
        // 로그 추가
        addLogEntry(`${accountId.replace('account', '')}번 계정 타이머 시작`);
    }
}

// 타이머 업데이트 함수 - 수정된 부분
function updateTimer(accountId) {
    const now = performance.now();
    const elapsed = now - accounts[accountId].startTime;
    
    // 실제 경과 시간 계산 (마지막 업데이트 이후 경과 시간)
    const timeSinceLastUpdate = now - accounts[accountId].lastUpdateTime;
    
    // 누적 시간 및 다음 휴식까지 시간 업데이트 (실제 경과 시간 기준)
    accounts[accountId].totalTime += timeSinceLastUpdate;
    accounts[accountId].nextRestTime -= timeSinceLastUpdate;
    
    // 마지막 업데이트 시간 갱신
    accounts[accountId].lastUpdateTime = now;
    
    // 세션 시간 업데이트
    accounts[accountId].sessionTime = elapsed;
    
    // 화면 업데이트
    document.getElementById(`${accountId}-total`).textContent = formatTime(accounts[accountId].totalTime);
    document.getElementById(`${accountId}-remaining`).textContent = formatTime(Math.max(0, accounts[accountId].goalTime - accounts[accountId].totalTime));
    document.getElementById(`${accountId}-session`).textContent = formatTime(accounts[accountId].sessionTime);
    document.getElementById(`${accountId}-next-rest`).textContent = formatTime(Math.max(0, accounts[accountId].nextRestTime));
    
    // 진행 상태 업데이트
    updateProgressBar(accountId);
    
    // 휴식 시간 체크
    if (accounts[accountId].nextRestTime <= 0) {
        startRest(accountId);
    }
    
    // 목표 달성 체크
    if (accounts[accountId].totalTime >= accounts[accountId].goalTime) {
        showNotification(`${accountId.replace('account', '')}번 계정의 목표 시간에 도달했습니다!`);
        playAlertSound();
        stopTimer(accountId);
    }
}

// 진행 상태 업데이트 함수
function updateProgressBar(accountId) {
    const progress = Math.min(100, (accounts[accountId].totalTime / accounts[accountId].goalTime) * 100);
    document.getElementById(`${accountId}-progress`).style.width = `${progress}%`;
}

// 타이머 정지 함수
function stopTimer(accountId) {
    if (accounts[accountId].isRunning) {
        accounts[accountId].isRunning = false;
        clearInterval(accounts[accountId].timerId);
        
        // 버튼 상태 업데이트
        document.getElementById(`${accountId}-start`).disabled = false;
        document.getElementById(`${accountId}-stop`).disabled = true;
        
        // 상태 업데이트
        document.getElementById(`${accountId}-status`).textContent = '대기 중';
        
        // 로그 추가
        addLogEntry(`${accountId.replace('account', '')}번 계정 타이머 정지 (총 ${formatTime(accounts[accountId].totalTime)})`);
    }
}

// 타이머 초기화 함수
function resetTimer(accountId) {
    stopTimer(accountId);
    
    accounts[accountId].totalTime = 0;
    accounts[accountId].sessionTime = 0;
    accounts[accountId].nextRestTime = accounts[accountId].intervalTime;
    
    // 화면 업데이트
    document.getElementById(`${accountId}-total`).textContent = formatTime(accounts[accountId].totalTime);
    document.getElementById(`${accountId}-remaining`).textContent = formatTime(accounts[accountId].goalTime);
    document.getElementById(`${accountId}-session`).textContent = formatTime(accounts[accountId].sessionTime);
    document.getElementById(`${accountId}-next-rest`).textContent = formatTime(accounts[accountId].nextRestTime);
    
    // 진행 상태 업데이트
    document.getElementById(`${accountId}-progress`).style.width = '0%';
    
    // 휴식 타이머 숨기기
    document.getElementById(`${accountId}-rest-timer`).style.display = 'none';
    
    // 로그 추가
    addLogEntry(`${accountId.replace('account', '')}번 계정 타이머 초기화`);
}

// 휴식 시작 함수
function startRest(accountId) {
    if (accounts[accountId].isResting) {
        return;
    }
    
    stopTimer(accountId);
    
    accounts[accountId].isResting = true;
    accounts[accountId].restStartTime = performance.now();
    accounts[accountId].restElapsedTime = 0;
    
    // 휴식 타이머 표시
    document.getElementById(`${accountId}-rest-timer`).style.display = 'block';
    document.getElementById(`${accountId}-rest-remaining`).textContent = formatTime(accounts[accountId].restTime);
    document.getElementById(`${accountId}-rest-progress`).style.width = '0%';
    
    // 상태 업데이트
    document.getElementById(`${accountId}-status`).textContent = '휴식 중';
    
    // 알림 표시 및 소리 재생
    showNotification(`${accountId.replace('account', '')}번 계정의 휴식 시간입니다!`);
    playAlertSound();
    
    // 휴식 타이머 시작
    accounts[accountId].restTimerId = setInterval(function() {
        updateRestTimer(accountId);
    }, 1000);
    
    // 로그 추가
    addLogEntry(`${accountId.replace('account', '')}번 계정 휴식 시작 (${formatTime(accounts[accountId].restTime)})`);
}

// 휴식 타이머 업데이트 함수
function updateRestTimer(accountId) {
    const now = performance.now();
    const elapsed = now - accounts[accountId].restStartTime;
    
    accounts[accountId].restElapsedTime = elapsed;
    const remaining = Math.max(0, accounts[accountId].restTime - accounts[accountId].restElapsedTime);
    
    // 화면 업데이트
    document.getElementById(`${accountId}-rest-remaining`).textContent = formatTime(remaining);
    
    // 진행 상태 업데이트
    const progress = Math.min(100, (accounts[accountId].restElapsedTime / accounts[accountId].restTime) * 100);
    document.getElementById(`${accountId}-rest-progress`).style.width = `${progress}%`;
    
    // 휴식 종료 체크
    if (remaining <= 0) {
        endRest(accountId);
    }
}

// 휴식 종료 함수
function endRest(accountId) {
    if (!accounts[accountId].isResting) {
        return;
    }
    
    accounts[accountId].isResting = false;
    clearInterval(accounts[accountId].restTimerId);
    
    // 휴식 타이머 숨기기
    document.getElementById(`${accountId}-rest-timer`).style.display = 'none';
    
    // 다음 휴식 시간 초기화
    accounts[accountId].nextRestTime = accounts[accountId].intervalTime;
    document.getElementById(`${accountId}-next-rest`).textContent = formatTime(accounts[accountId].nextRestTime);
    
    // 상태 업데이트
    document.getElementById(`${accountId}-status`).textContent = '대기 중';
    
    // 알림 표시 및 소리 재생
    showNotification(`${accountId.replace('account', '')}번 계정의 휴식 시간이 종료되었습니다!`);
    playAlertSound();
    
    // 로그 추가
    addLogEntry(`${accountId.replace('account', '')}번 계정 휴식 종료`);
}

// 알림 표시 함수
function showNotification(message) {
    document.getElementById('notification-message').textContent = message;
    document.getElementById('notification').style.display = 'flex';
}

// 시간 포맷 함수 (밀리초 -> HH:MM:SS)
function formatTime(milliseconds) {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    
    seconds %= 60;
    minutes %= 60;
    
    return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
}

// 숫자 앞에 0 추가 함수
function padZero(number) {
    return number.toString().padStart(2, '0');
}

// 로그 추가 함수
function addLogEntry(message) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = `[${timeString}] ${message}`;
    
    const logContainer = document.getElementById('log-container');
    logContainer.insertBefore(logEntry, logContainer.firstChild);
}

// 페이지 로드 시 초기화
window.addEventListener('DOMContentLoaded', initializeApp);
