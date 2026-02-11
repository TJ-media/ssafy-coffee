// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 👇 1. 애니메이션 정의 추가
      animation: {
        'slide-up': 'slide-up 0.5s ease-out forwards',
        'bounce-in': 'bounce-in 0.8s cubic-bezier(0.8, 0, 1, 1) forwards',
      },
      // 👇 2. 키프레임(동작) 정의 추가
      keyframes: {
        'slide-up': {
          '0%': {opacity: '0', transform: 'translateY(20px)'},
          '100%': {opacity: '1', transform: 'translateY(0)'},
        },
        'bounce-in': {
          '0%': {transform: 'scale(0.5)', opacity: '0'},
          '50%': {transform: 'scale(1.05)'},
          '70%': {transform: 'scale(0.9)'},
          '100%': {transform: 'scale(1)', opacity: '1'},
        }
      },
      colors: {
        // 제공된 테마 색상 매핑
        primary: '#3a9df2', // buttonBg, sidebarBg, linkColor
        'primary-dark': '#2a87de', // sidebarHeaderBg, sidebarTeamBarBg
        'primary-light': '#49a5f3', // mentionColor, sidebarTextActiveBorder, sidebarTextHoverBg
        secondary: '#72bd94', // newMessageSeparator (초록색 계열 활용)
        accent: '#fcd172', // awayIndicator (노란색 계열 활용)
        danger: '#e26f72', // dndIndicator, errorTextColor
        
        background: '#f2f4f6', // 토스 느낌의 밝은 회색 배경
        surface: '#ffffff', // centerChannelBg, mentionBg, buttonColor, sidebarHeaderTextColor 등
        
        text: {
          primary: '#3f4350', // centerChannelColor
          secondary: '#8b95a1', // 부가 텍스트용 (임의 지정)
          white: '#ffffff', // sidebarText, sidebarUnreadText
        }
      },
      boxShadow: {
        'toss': '0 2px 8px 0 rgba(0, 0, 0, 0.05)', // 토스 스타일의 부드러운 그림자
        'toss-up': '0 -2px 8px 0 rgba(0, 0, 0, 0.05)', // 하단 시트용
      },
      borderRadius: {
        'toss': '1.25rem', // 20px
      }
    },
  },
  plugins: [],
}