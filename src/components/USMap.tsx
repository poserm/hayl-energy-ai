'use client'

import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface USMapProps {
  containerId: string
}

export default function USMap({ containerId }: USMapProps) {
  useEffect(() => {
    // Check if map already exists
    const container = L.DomUtil.get(containerId)
    if (container != null) {
      // @ts-ignore
      if (container._leaflet_id) {
        return
      }
    }

    // Initialize map centered on United States
    const map = L.map(containerId, {
      center: [39.8283, -98.5795], // Geographic center of USA
      zoom: 4,
      zoomControl: true,
      scrollWheelZoom: true,
    })

    // Dark mode tile layer using CartoDB Dark Matter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    // Custom zoom control positioning
    map.zoomControl.setPosition('topright')

    // Add custom styling to map container
    const mapContainer = document.getElementById(containerId)
    if (mapContainer) {
      mapContainer.style.background = '#1a1a1a'
    }

    // Cleanup function
    return () => {
      map.remove()
    }
  }, [containerId])

  return (
    <div
      id={containerId}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '400px' }}
    />
  )
}
