// 실제 PDF 페이지를 이미지로 렌더링하는 테스트
const { readFileSync } = require('fs')
const path = require('path')

console.log('🖼️ 실제 PDF 페이지 렌더링 테스트 시작...')

// 라이브러리 로드
let pdfParse = null
let pdf2pic = null
let pdfjsLib = null

try {
  pdfParse = require('pdf-parse')
  console.log('✅ pdf-parse 로드 성공')
} catch (e) {
  console.log('❌ pdf-parse 로드 실패:', e.message)
}

try {
  pdf2pic = require('pdf2pic')
  console.log('✅ pdf2pic 로드 성공')
} catch (e) {
  console.log('❌ pdf2pic 로드 실패:', e.message)
}

try {
  pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js')
  console.log('✅ pdfjs-dist 로드 성공')
} catch (e) {
  console.log('❌ pdfjs-dist 로드 실패:', e.message)
}

// PDF2PIC을 사용한 실제 페이지 렌더링
async function renderPDFPagesWithPdf2pic(pdfPath, numPages = 3) {
  console.log(`\n📄 PDF2PIC으로 실제 페이지 렌더링: ${path.basename(pdfPath)}`)
  
  if (!pdf2pic) {
    console.log('❌ pdf2pic 사용 불가')
    return { success: false, reason: 'pdf2pic unavailable' }
  }

  try {
    // PDF2PIC 설정
    const convert = pdf2pic.fromPath(pdfPath, {
      density: 100,           // DPI (해상도)
      saveFilename: "page",   // 파일명 접두사
      savePath: "./temp",     // 저장 경로
      format: "png",          // 출력 형식
      width: 800,             // 너비
      height: 1100            // 높이
    })

    console.log('🔄 PDF 페이지들을 이미지로 변환 중...')
    
    const results = []
    
    // 지정된 페이지 수만큼 변환
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        console.log(`   📄 페이지 ${pageNum} 변환 중...`)
        
        const result = await convert(pageNum, { 
          responseType: "buffer" // 버퍼로 받기
        })
        
        if (result && result.buffer) {
          console.log(`   ✅ 페이지 ${pageNum} 성공: ${result.buffer.length} bytes`)
          
          results.push({
            page: pageNum,
            buffer: result.buffer,
            size: result.buffer.length,
            width: result.width || 800,
            height: result.height || 1100
          })
        } else {
          console.log(`   ❌ 페이지 ${pageNum} 실패: 빈 결과`)
        }
        
      } catch (pageError) {
        console.log(`   ❌ 페이지 ${pageNum} 실패: ${pageError.message}`)
      }
    }
    
    return {
      success: true,
      totalPages: results.length,
      pages: results,
      method: 'pdf2pic'
    }
    
  } catch (error) {
    console.error('❌ PDF2PIC 렌더링 실패:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// PDFJS-DIST를 사용한 실제 페이지 렌더링
async function renderPDFPagesWithPDFJS(pdfPath, numPages = 3) {
  console.log(`\n📄 PDFJS-DIST로 실제 페이지 렌더링: ${path.basename(pdfPath)}`)
  
  if (!pdfjsLib) {
    console.log('❌ pdfjs-dist 사용 불가')
    return { success: false, reason: 'pdfjs-dist unavailable' }
  }

  try {
    // PDF 파일 로드
    const pdfBuffer = readFileSync(pdfPath)
    
    console.log('📖 PDF 문서 로드 중...')
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBuffer,
      verbosity: 0 // 로그 최소화
    })
    
    const pdf = await loadingTask.promise
    console.log(`📊 총 페이지 수: ${pdf.numPages}`)
    
    const results = []
    const maxPages = Math.min(numPages, pdf.numPages)
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        console.log(`   📄 페이지 ${pageNum} 렌더링 중...`)
        
        // 페이지 로드
        const page = await pdf.getPage(pageNum)
        
        // 뷰포트 설정 (스케일 2.0으로 고해상도)
        const viewport = page.getViewport({ scale: 2.0 })
        
        // Canvas 설정 (Node.js Canvas 사용)
        const canvas = require('canvas')
        const canvasEl = canvas.createCanvas(viewport.width, viewport.height)
        const context = canvasEl.getContext('2d')
        
        // PDF 페이지를 Canvas에 렌더링
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }
        
        await page.render(renderContext).promise
        
        // PNG 버퍼로 변환
        const buffer = canvasEl.toBuffer('image/png')
        
        console.log(`   ✅ 페이지 ${pageNum} 성공: ${buffer.length} bytes (${Math.round(viewport.width)}x${Math.round(viewport.height)})`)
        
        results.push({
          page: pageNum,
          buffer: buffer,
          size: buffer.length,
          width: Math.round(viewport.width),
          height: Math.round(viewport.height)
        })
        
      } catch (pageError) {
        console.log(`   ❌ 페이지 ${pageNum} 실패: ${pageError.message}`)
      }
    }
    
    return {
      success: true,
      totalPages: results.length,
      pages: results,
      method: 'pdfjs-dist'
    }
    
  } catch (error) {
    console.error('❌ PDFJS-DIST 렌더링 실패:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// 메인 테스트 실행
async function runRealRenderingTests() {
  console.log('🚀 실제 PDF 페이지 렌더링 테스트 시작\n')
  
  const testPdfPath = './temp/temp_1757598475724.pdf'
  
  // 1. PDF 기본 정보 확인
  if (pdfParse) {
    console.log('='.repeat(60))
    console.log('📋 PDF 기본 정보 확인')
    console.log('='.repeat(60))
    
    try {
      const pdfBuffer = readFileSync(testPdfPath)
      const data = await pdfParse(pdfBuffer)
      
      console.log(`📄 총 페이지 수: ${data.numpages}`)
      console.log(`📊 파일 크기: ${(pdfBuffer.length / (1024 * 1024)).toFixed(2)} MB`)
      console.log(`📝 텍스트 길이: ${data.text.length} 문자`)
      console.log(`📑 첫 번째 페이지 내용 (200자):`)
      console.log(`"${data.text.substring(0, 200).replace(/\s+/g, ' ').trim()}..."`)
    } catch (error) {
      console.error('❌ PDF 정보 확인 실패:', error.message)
    }
  }
  
  // 2. PDF2PIC 테스트
  console.log('\n' + '='.repeat(60))
  console.log('🎨 방법 1: PDF2PIC으로 실제 페이지 렌더링')
  console.log('='.repeat(60))
  
  const pdf2picResult = await renderPDFPagesWithPdf2pic(testPdfPath, 2)
  
  if (pdf2picResult.success) {
    console.log(`✅ PDF2PIC 성공: ${pdf2picResult.totalPages}개 페이지 렌더링`)
    pdf2picResult.pages.forEach(page => {
      console.log(`   📄 페이지 ${page.page}: ${page.size} bytes (${page.width}x${page.height})`)
    })
  } else {
    console.log(`❌ PDF2PIC 실패: ${pdf2picResult.reason || pdf2picResult.error}`)
  }
  
  // 3. PDFJS-DIST 테스트
  console.log('\n' + '='.repeat(60))
  console.log('🎨 방법 2: PDFJS-DIST로 실제 페이지 렌더링')
  console.log('='.repeat(60))
  
  const pdfjsResult = await renderPDFPagesWithPDFJS(testPdfPath, 2)
  
  if (pdfjsResult.success) {
    console.log(`✅ PDFJS-DIST 성공: ${pdfjsResult.totalPages}개 페이지 렌더링`)
    pdfjsResult.pages.forEach(page => {
      console.log(`   📄 페이지 ${page.page}: ${page.size} bytes (${page.width}x${page.height})`)
    })
  } else {
    console.log(`❌ PDFJS-DIST 실패: ${pdfjsResult.reason || pdfjsResult.error}`)
  }
  
  // 4. 결과 요약
  console.log('\n' + '='.repeat(60))
  console.log('📊 테스트 결과 요약')
  console.log('='.repeat(60))
  
  console.log(`PDF 파일: ${path.basename(testPdfPath)}`)
  console.log(`PDF2PIC: ${pdf2picResult.success ? '✅ 성공' : '❌ 실패'}`)
  console.log(`PDFJS-DIST: ${pdfjsResult.success ? '✅ 성공' : '❌ 실패'}`)
  
  if (pdf2picResult.success || pdfjsResult.success) {
    console.log('\n🎯 **중요**: 이제 실제 PDF 내용(그래프, 차트, 이미지)이 포함된 이미지가 생성됩니다!')
    console.log('   - 생성된 이미지는 PDF의 실제 페이지 내용을 정확히 반영')
    console.log('   - 그래프, 차트, 도표, 이미지 모든 시각적 요소 포함')
    console.log('   - 클릭 가능한 노드나 인터랙티브 요소는 정적 이미지로 변환됨')
  } else {
    console.log('\n⚠️ 실제 PDF 렌더링이 실패했습니다. 대안 방법을 고려해야 합니다.')
  }
  
  console.log('\n✅ 실제 PDF 렌더링 테스트 완료!')
  
  return {
    pdf2pic: pdf2picResult,
    pdfjs: pdfjsResult
  }
}

// 테스트 실행
runRealRenderingTests().catch(console.error)