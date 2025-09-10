import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>PwC 온톨로지 자동 구축 서비스</title>
        
        {/* TailwindCSS */}
        <script src="https://cdn.tailwindcss.com"></script>
        
        {/* FontAwesome Icons */}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
        
        {/* React & ReactDOM */}
        <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        
        {/* Three.js */}
        <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
        
        {/* D3.js */}
        <script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script>
        
        {/* GSAP for animations */}
        <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
        
        {/* Custom styles - 인라인으로 포함하여 Railway 호환성 확보 */}
        <style>{`
          /* PwC 온톨로지 서비스 - 추가 스타일 */
          .graph-container { cursor: grab; user-select: none; }
          .graph-container:active { cursor: grabbing; }
          
          /* 제어판 스타일 개선 */
          .control-panel { animation: fadeInLeft 0.6s ease-out; }
          @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
          
          /* 인사이트 패널 스타일 개선 */
          .insight-panel { animation: fadeInRight 0.6s ease-out; }
          @keyframes fadeInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
          
          /* 버튼 호버 효과 개선 */
          button { transition: all 0.3s ease; }
          button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); }
          
          /* PwC 브랜드 컬러 */
          .pwc-red { color: #e74c3c; }
          .pwc-blue { color: #3498db; }
          .pwc-orange { color: #e67e22; }
          
          /* 로딩 스피너 */
          .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #f3f3f3; border-top: 2px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          
          /* 상태바 개선 */
          .status-bar { backdrop-filter: blur(10px); animation: fadeInUp 0.8s ease-out; }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          
          /* 반응형 디자인 */
          @media (max-width: 768px) {
            .control-panel, .insight-panel { position: relative; top: auto; left: auto; right: auto; width: 100%; margin: 10px 0; max-height: none; }
            .graph-container { height: 50vh; }
          }
        `}</style>
        
        <style>{`
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
          }
          
          .graph-container {
            width: 100vw;
            height: 100vh;
            position: relative;
            background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
          }
          
          .control-panel {
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.95);
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            min-width: 300px;
          }
          
          .insight-panel {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.95);
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            min-width: 280px;
            max-height: 60vh;
            overflow-y: auto;
          }
          
          .status-bar {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .pulse {
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          .glow {
            animation: glow 2s ease-in-out infinite alternate;
          }
          
          @keyframes glow {
            from { box-shadow: 0 0 5px #e74c3c; }
            to { box-shadow: 0 0 20px #e74c3c, 0 0 30px #e74c3c; }
          }
          
          .slide-in {
            animation: slideIn 0.5s ease-out;
          }
          
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </head>
      <body>
        {children}
        
        {/* Main React App Script */}
        <script src="/static/app.js"></script>
      </body>
    </html>
  )
})
