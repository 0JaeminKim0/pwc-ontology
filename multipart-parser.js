// 개선된 multipart/form-data 파서 (Railway 전용)

/**
 * multipart/form-data 파싱 함수
 * @param {Buffer} buffer - 원본 데이터 버퍼
 * @param {string} boundary - multipart boundary 문자열
 * @returns {Array} 파싱된 파트들의 배열
 */
export function parseMultipartData(buffer, boundary) {
  const parts = []
  
  // boundary 변형들을 시도 (브라우저마다 다를 수 있음)
  const boundaryVariants = [
    `--${boundary}`,
    `\r\n--${boundary}`,
    `\n--${boundary}`,
    boundary
  ]
  
  let boundaryBuffer = null
  let boundaryIndex = -1
  
  // 가장 적합한 boundary 찾기
  for (const variant of boundaryVariants) {
    const testBuffer = Buffer.from(variant)
    const testIndex = buffer.indexOf(testBuffer)
    if (testIndex !== -1) {
      boundaryBuffer = testBuffer
      boundaryIndex = testIndex
      console.log(`✅ 유효한 boundary 발견: "${variant}" at ${testIndex}`)
      break
    }
  }
  
  if (!boundaryBuffer) {
    console.error('❌ 모든 boundary 변형 실패')
    return []
  }
  
  // boundary로 분할
  const sections = []
  let start = boundaryIndex + boundaryBuffer.length
  
  while (true) {
    const nextBoundaryIndex = buffer.indexOf(boundaryBuffer, start)
    
    if (nextBoundaryIndex === -1) {
      // 마지막 섹션
      const lastSection = buffer.slice(start)
      if (lastSection.length > 10) { // 최소 크기 체크
        sections.push(lastSection)
      }
      break
    }
    
    const section = buffer.slice(start, nextBoundaryIndex)
    if (section.length > 10) { // 빈 섹션 제외
      sections.push(section)
    }
    
    start = nextBoundaryIndex + boundaryBuffer.length
  }
  
  console.log(`📄 총 ${sections.length}개 섹션 발견`)
  
  // 각 섹션을 파트로 파싱
  sections.forEach((section, index) => {
    const part = parseSection(section, index + 1)
    if (part) {
      parts.push(part)
    }
  })
  
  return parts
}

/**
 * 개별 섹션 파싱
 * @param {Buffer} section - 섹션 데이터
 * @param {number} index - 섹션 인덱스
 * @returns {Object|null} 파싱된 파트 객체
 */
function parseSection(section, index) {
  // 헤더와 본문 분리 (\r\n\r\n 또는 \n\n)
  let headerEndIndex = section.indexOf(Buffer.from('\r\n\r\n'))
  let headerEndLength = 4
  
  if (headerEndIndex === -1) {
    headerEndIndex = section.indexOf(Buffer.from('\n\n'))
    headerEndLength = 2
  }
  
  if (headerEndIndex === -1) {
    console.warn(`⚠️ 섹션 ${index}: 헤더 끝을 찾을 수 없음`)
    return null
  }
  
  const headerBuffer = section.slice(0, headerEndIndex)
  const bodyBuffer = section.slice(headerEndIndex + headerEndLength)
  
  // 헤더 파싱
  const headerStr = headerBuffer.toString('utf8').trim()
  console.log(`📋 섹션 ${index} 헤더:`, headerStr)
  console.log(`📄 섹션 ${index} 본문 크기:`, bodyBuffer.length)
  
  // Content-Disposition 파싱
  const dispositionMatch = headerStr.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i)
  
  if (!dispositionMatch) {
    console.warn(`⚠️ 섹션 ${index}: Content-Disposition 파싱 실패`)
    return null
  }
  
  const fieldName = dispositionMatch[1]
  const fileName = dispositionMatch[2]
  
  // Content-Type 파싱
  const contentTypeMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i)
  const contentType = contentTypeMatch ? contentTypeMatch[1].trim() : 'text/plain'
  
  const part = {
    fieldName,
    fileName,
    contentType,
    headers: headerStr,
    data: bodyBuffer,
    isFile: !!fileName,
    size: bodyBuffer.length
  }
  
  console.log(`✅ 섹션 ${index} 파싱 완료:`, {
    fieldName,
    fileName: fileName || 'N/A',
    contentType,
    size: bodyBuffer.length,
    isFile: part.isFile
  })
  
  return part
}

/**
 * 파일 데이터 검증
 * @param {Buffer} data - 파일 데이터
 * @param {string} fileName - 파일명
 * @returns {Object} 검증 결과
 */
export function validateFileData(data, fileName) {
  // PDF 매직 넘버 체크
  const pdfMagic = Buffer.from('%PDF')
  const isPDF = data.slice(0, 4).equals(pdfMagic)
  
  // 최소 파일 크기 체크
  const minSize = 100 // 100바이트 이상
  const isValidSize = data.length >= minSize
  
  // [object Object] 문자열 체크
  const dataStr = data.toString('utf8', 0, Math.min(50, data.length))
  const isObjectString = dataStr.includes('[object Object]')
  
  return {
    isPDF,
    isValidSize,
    isObjectString,
    isValid: isPDF && isValidSize && !isObjectString,
    dataPreview: dataStr.substring(0, 50),
    size: data.length
  }
}