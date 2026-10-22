function LogoMark() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 2.5 25 6.25v7.5c0 6.4-4.2 11.6-10 13.75C9.2 25.35 5 20.15 5 13.75v-7.5L15 2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <g transform="rotate(-45 15 14.5)">
        <rect x="9" y="11.75" width="12" height="5.5" rx="2.75" stroke="currentColor" strokeWidth="1.5" />
        <path d="M15 11.75h-3.25a2.75 2.75 0 0 0 0 5.5H15v-5.5Z" fill="currentColor" />
      </g>
    </svg>
  )
}

export default LogoMark
