import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Yasmin · Caderno Técnico Digital';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#FDF6F8',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            fontSize: 140,
            fontWeight: 700,
            color: '#4A2330',
            fontStyle: 'italic',
            fontFamily: 'serif',
            lineHeight: 1,
          }}
        >
          Yasmin<span style={{ color: '#C85A7E' }}>.</span>
        </div>
        <div
          style={{
            fontSize: 24,
            color: '#A88C95',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginTop: 30,
            fontFamily: 'monospace',
          }}
        >
          Caderno Técnico Digital
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            background: 'linear-gradient(90deg, #C85A7E 0%, #A83C5E 100%)',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
