export default function TrashIcon(props) {
  const { fill, size } = props;

  fill ||= "#D0D0D0";
  size ||= "20";

  return (
    <i>
      <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
        width={`${size}pt`} height={`${size}pt`} viewBox={`0 0 240 240`}
        preserveAspectRatio="xMidYMid meet">
        <g transform="translate(0.000000,240.000000) scale(0.100000,-0.100000)" fill={fill}>
          <path d="M930 2375 c0 -39 -46 -121 -82 -147 -33 -23 -36 -23 -340 -26 l-308
  -3 0 -99 0 -100 1000 0 1000 0 0 100 0 99 -307 3 c-305 3 -308 3 -341 26 -36
  26 -82 108 -82 147 l0 25 -270 0 -270 0 0 -25z"/>
          <path d="M300 900 l0 -900 900 0 900 0 0 900 0 900 -900 0 -900 0 0 -900z
  m449 586 c15 -8 32 -26 39 -41 17 -37 17 -1053 0 -1090 -13 -29 -55 -55 -88
  -55 -33 0 -75 26 -88 55 -18 40 -16 1061 2 1094 26 47 84 63 135 37z m500 0
  c15 -8 32 -26 39 -41 17 -37 17 -1053 0 -1090 -13 -29 -55 -55 -88 -55 -33 0
  -75 26 -88 55 -18 40 -16 1061 2 1094 26 47 84 63 135 37z m500 0 c15 -8 32
  -26 39 -41 17 -37 17 -1053 0 -1090 -13 -29 -55 -55 -88 -55 -33 0 -75 26 -88
  55 -18 40 -16 1061 2 1094 26 47 84 63 135 37z"/>
        </g>
      </svg>
    </i>
  )
}
