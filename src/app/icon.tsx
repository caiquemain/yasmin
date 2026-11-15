import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #C85A7E 0%, #A83C5E 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            fontFamily: 'serif',
            fontSize: 340,
            fontWeight: 700,
            color: '#FDF6F8',
            fontStyle: 'italic',
            lineHeight: 1,
            marginTop: -30,
            marginLeft: -10,
          }}
        >
          Y
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            right: 100,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: '#FDF6F8',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
