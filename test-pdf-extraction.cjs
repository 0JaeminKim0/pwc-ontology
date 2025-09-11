// 실제 PDF 텍스트 추출 및 이미지 변환 테스트
const { readFileSync } = require('fs')

console.log('📄 PDF 추출 테스트 시작...')

// Optional dependencies 안전하게 로드
let pdfParse = null
let sharp = null
let canvas = null

try {
  pdfParse = require('pdf-parse')
  console.log('✅ pdf-parse 모듈 로드 성공')
} catch (e) {
  console.log('❌ pdf-parse 모듈 로드 실패:', e.message)
}

try {
  sharp = require('sharp')
  console.log('✅ sharp 모듈 로드 성공')
} catch (e) {
  console.log('❌ sharp 모듈 로드 실패:', e.message)
}

try {
  canvas = require('canvas')
  console.log('✅ canvas 모듈 로드 성공')
} catch (e) {
  console.log('❌ canvas 모듈 로드 실패:', e.message)
}

// 실제 PDF 텍스트 추출 함수
async function testRealPDFExtraction(pdfPath) {
  console.log(`🔍 PDF 파일 분석: ${pdfPath}`)
  
  try {
    // 파일 읽기
    const pdfBuffer = readFileSync(pdfPath)
    console.log(`📊 파일 크기: ${(pdfBuffer.length / (1024 * 1024)).toFixed(2)} MB`)
    
    // pdf-parse로 텍스트 추출
    if (pdfParse) {
      console.log('📄 pdf-parse로 텍스트 추출 중...')
      const data = await pdfParse(pdfBuffer)
      
      console.log(`✅ 텍스트 추출 성공:`)
      console.log(`   - 페이지 수: ${data.numpages}`)
      console.log(`   - 텍스트 길이: ${data.text.length} 문자`)
      console.log(`   - 제목: ${data.info?.Title || 'N/A'}`)
      
      // 첫 500문자 출력
      console.log(`📝 첫 500문자 미리보기:`)
      console.log(`"${data.text.substring(0, 500).replace(/\s+/g, ' ').trim()}..."`)
      
      // 페이지별 텍스트 분할 예시
      const textPerPage = Math.ceil(data.text.length / data.numpages)
      console.log(`📑 페이지당 예상 텍스트 길이: ${textPerPage} 문자`)
      
      // 첫 3페이지 내용 샘플
      for (let i = 1; i <= Math.min(3, data.numpages); i++) {
        const startIdx = (i - 1) * textPerPage
        const endIdx = Math.min(i * textPerPage, data.text.length)
        const pageText = data.text.substring(startIdx, endIdx).trim()
        
        if (pageText.length > 0) {
          console.log(`\n📄 페이지 ${i} 샘플 (${pageText.length} 문자):`)
          console.log(`"${pageText.substring(0, 200).replace(/\s+/g, ' ')}..."`)
        }
      }
      
      return {
        success: true,
        numPages: data.numpages,
        textLength: data.text.length,
        fullText: data.text,
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject
      }
    } else {
      console.log('⚠️ pdf-parse가 사용 불가능, 대안 방법 사용')
      
      // 파일 크기 기반 추정
      const fileSizeMB = pdfBuffer.length / (1024 * 1024)
      const estimatedPages = Math.ceil(fileSizeMB * 5) // 1MB당 약 5페이지
      
      console.log(`📊 추정 결과:`)
      console.log(`   - 추정 페이지 수: ${estimatedPages}`)
      console.log(`   - 파일 크기: ${fileSizeMB.toFixed(2)} MB`)
      
      return {
        success: false,
        reason: 'pdf-parse unavailable',
        estimatedPages: estimatedPages,
        fileSize: pdfBuffer.length
      }
    }
    
  } catch (error) {
    console.error('❌ PDF 분석 실패:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// Canvas를 사용한 페이지 이미지 생성 테스트
function testPageImageGeneration(pageNumber, title) {
  console.log(`🖼️ 페이지 ${pageNumber} 이미지 생성 테스트: ${title}`)
  
  if (canvas) {
    try {
      const { createCanvas } = canvas
      const canvasEl = createCanvas(800, 1100)
      const ctx = canvasEl.getContext('2d')
      
      // 배경
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 800, 1100)
      
      // 테두리
      ctx.strokeStyle = '#e31e24'
      ctx.lineWidth = 3
      ctx.strokeRect(0, 0, 800, 1100)
      
      // 헤더
      ctx.fillStyle = '#e31e24'
      ctx.fillRect(20, 20, 760, 60)
      
      // 제목
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`페이지 ${pageNumber}`, 400, 55)
      
      // 내용
      ctx.fillStyle = '#2c3e50'
      ctx.font = '16px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(title, 40, 120)
      
      // PNG 버퍼로 변환
      const buffer = canvasEl.toBuffer('image/png')
      console.log(`✅ 이미지 생성 성공: ${buffer.length} bytes`)
      
      return {
        success: true,
        buffer: buffer,
        width: 800,
        height: 1100
      }
    } catch (error) {
      console.error('❌ Canvas 이미지 생성 실패:', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  } else {
    console.log('⚠️ Canvas가 사용 불가능, SVG fallback 사용')
    
    // SVG fallback
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="white" stroke="#e31e24" stroke-width="3"/>
        <rect x="10" y="10" width="380" height="40" fill="#e31e24"/>
        <text x="200" y="35" fill="white" font-family="Arial" font-size="16" text-anchor="middle" font-weight="bold">
          페이지 ${pageNumber}
        </text>
        <text x="200" y="80" fill="#2c3e50" font-family="Arial" font-size="12" text-anchor="middle">
          ${title}
        </text>
      </svg>
    `
    
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\n\s*/g, ''))}`
    
    return {
      success: true,
      type: 'svg',
      dataUrl: dataUrl
    }
  }
}

// 메인 테스트 실행
async function runTests() {
  console.log('🚀 PDF 추출 및 이미지 변환 테스트 시작\n')
  
  // 사용 가능한 PDF 파일로 테스트
  const testPdfPath = './temp/temp_1757598475724.pdf'
  
  console.log('='.repeat(60))
  console.log('📄 1. PDF 텍스트 추출 테스트')
  console.log('='.repeat(60))
  
  const extractionResult = await testRealPDFExtraction(testPdfPath)
  
  if (extractionResult.success) {
    console.log('\n='.repeat(60))
    console.log('🖼️ 2. 페이지 이미지 생성 테스트')
    console.log('='.repeat(60))
    
    // 처음 3페이지에 대해 이미지 생성 테스트
    for (let i = 1; i <= Math.min(3, extractionResult.numPages); i++) {
      const pageTitle = `${extractionResult.title || 'PDF 문서'} - 페이지 ${i}`
      const imageResult = testPageImageGeneration(i, pageTitle)
      
      if (imageResult.success) {
        if (imageResult.type === 'svg') {
          console.log(`   📄 페이지 ${i}: SVG 생성 (${imageResult.dataUrl.length} 문자)`)
        } else {
          console.log(`   📄 페이지 ${i}: PNG 생성 (${imageResult.buffer.length} bytes)`)
        }
      }
    }
  }
  
  console.log('\n='.repeat(60))
  console.log('📊 3. 테스트 결과 요약')
  console.log('='.repeat(60))
  
  console.log(`PDF 파일: ${testPdfPath}`)
  console.log(`pdf-parse: ${pdfParse ? '✅ 사용 가능' : '❌ 사용 불가'}`)
  console.log(`Canvas: ${canvas ? '✅ 사용 가능' : '❌ 사용 불가 (SVG fallback)'}`)
  console.log(`Sharp: ${sharp ? '✅ 사용 가능' : '❌ 사용 불가'}`)
  
  if (extractionResult.success) {
    console.log(`텍스트 추출: ✅ 성공 (${extractionResult.numPages}페이지, ${extractionResult.textLength}문자)`)
  } else {
    console.log(`텍스트 추출: ❌ 실패 (${extractionResult.reason || extractionResult.error})`)
  }
  
  console.log('\n✅ 테스트 완료!')
}

// 테스트 실행
runTests().catch(console.error)