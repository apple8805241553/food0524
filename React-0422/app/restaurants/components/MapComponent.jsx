'use client'

import { useEffect, useRef } from 'react'

const MapComponent = ({ latitude, longitude, name, address }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 動態引入 leaflet
      import('leaflet').then((L) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
        }

        // 初始化地圖
        mapInstanceRef.current = L.map(mapRef.current).setView(
          [latitude, longitude],
          15
        )

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(mapInstanceRef.current)

        // 添加標記
        L.marker([latitude, longitude])
          .addTo(mapInstanceRef.current)
          .bindPopup(`<strong>${name}</strong><br>${address}`)
          .openPopup()
      })
    }

    // 清理函數
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }
    }
  }, [latitude, longitude, name, address])

  return <div ref={mapRef} style={{ height: '400px', width: '100%' }} />
}

export default MapComponent
