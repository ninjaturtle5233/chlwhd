// 정밀한 타이밍 동기화 솔루션
// 1분 1초가 정확히 작동하도록 구현

function syncTimeWithRealTimePrecise() {
  // 타이머 요소 찾기
  const timeElements = document.querySelectorAll('div');
  const accumulatedTimeElements = [];
  const currentSessionElements = [];
  
  // 텍스트 내용으로 요소 필터링
  timeElements.forEach(element => {
    if (element.textContent.includes('누적 플레이 시간:')) {
      accumulatedTimeElements.push(element);
    }
    if (element.textContent.includes('현재 세션 시간:')) {
      currentSessionElements.push(element);
    }
  });
  
  console.log(`누적 플레이 시간 요소: ${accumulatedTimeElements.length}개 찾음`);
  console.log(`현재 세션 시간 요소: ${currentSessionElements.length}개 찾음`);
  
  // 시작 시간 기록 (정밀한 타이밍을 위해)
  const startTimes = new Array(accumulatedTimeElements.length).fill(0);
  const isRunning = new Array(accumulatedTimeElements.length).fill(false);
  
  // 현재 상태 확인 및 시작 시간 설정
  for (let i = 0; i < accumulatedTimeElements.length; i++) {
    const sessionElement = currentSessionElements[i];
    if (!sessionElement) continue;
    
    const parentElement = sessionElement.parentElement;
    if (!parentElement) continue;
    
    // 상태 텍스트 확인 (대기 중 또는 실행 중)
    const statusElements = parentElement.querySelectorAll('div');
    let isActive = false;
    
    statusElements.forEach(element => {
      if (element.textContent.includes('실행 중')) {
        isActive = true;
      }
    });
    
    if (isActive) {
      // 현재 세션 시간 파싱
      const sessionTimeStr = sessionElement.textContent.split(': ')[1];
      if (!sessionTimeStr) continue;
      
      const sessionTimeParts = sessionTimeStr.split(':');
      if (sessionTimeParts.length !== 3) continue;
      
      const sessionSeconds = parseInt(sessionTimeParts[0]) * 3600 + 
                            parseInt(sessionTimeParts[1]) * 60 + 
                            parseInt(sessionTimeParts[2]);
      
      // 현재 시간에서 세션 시간을 빼서 시작 시간 계산
      startTimes[i] = Date.now() - (sessionSeconds * 1000);
      isRunning[i] = true;
    }
  }
  
  // 타이머 업데이트 함수 (정밀한 타이밍)
  function updateTimersPrecise() {
    const now = Date.now();
    
    // 모든 계정의 타이머 업데이트
    for (let i = 0; i < accumulatedTimeElements.length; i++) {
      const accElement = accumulatedTimeElements[i];
      const sessionElement = currentSessionElements[i];
      
      if (!accElement || !sessionElement) continue;
      
      // 타이머가 활성화된 계정만 업데이트
      if (!isRunning[i]) {
        // 상태 확인 및 업데이트
        const parentElement = sessionElement.parentElement;
        if (!parentElement) continue;
        
        const statusElements = parentElement.querySelectorAll('div');
        let isActive = false;
        
        statusElements.forEach(element => {
          if (element.textContent.includes('실행 중')) {
            isActive = true;
          }
        });
        
        if (isActive) {
          // 새로 활성화된 계정의 시작 시간 설정
          startTimes[i] = now;
          isRunning[i] = true;
        } else {
          continue;
        }
      }
      
      // 정확한 경과 시간 계산 (밀리초 단위)
      const elapsedMs = now - startTimes[i];
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      
      // 초를 시:분:초 형식으로 변환
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      const seconds = elapsedSeconds % 60;
      
      // 형식화된 시간 문자열
      const formattedTime = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // 시간 업데이트
      accElement.textContent = `누적 플레이 시간: ${formattedTime}`;
      sessionElement.textContent = `현재 세션 시간: ${formattedTime}`;
      
      // 상태 확인 - 종료 버튼이 눌렸는지 확인
      const parentElement = sessionElement.parentElement;
      if (!parentElement) continue;
      
      const statusElements = parentElement.querySelectorAll('div');
      let isActive = false;
      
      statusElements.forEach(element => {
        if (element.textContent.includes('실행 중')) {
          isActive = true;
        }
      });
      
      if (!isActive) {
        isRunning[i] = false;
      }
    }
  }
  
  // 기존 타이머 제거
  for (let i = 1; i < 10000; i++) {
    window.clearInterval(i);
  }
  
  // 정밀한 타이밍을 위해 더 짧은 간격으로 업데이트 (100ms)
  const intervalId = setInterval(updateTimersPrecise, 100);
  console.log(`정밀한 타이머가 실제 시간과 동기화되었습니다. (Interval ID: ${intervalId})`);
  
  return intervalId;
}

// 함수 실행
try {
  const intervalId = syncTimeWithRealTimePrecise();
  console.log(`정밀한 타이머 동기화 솔루션이 적용되었습니다. (Interval ID: ${intervalId})`);
} catch (error) {
  console.error("타이머 동기화 중 오류 발생:", error);
}
