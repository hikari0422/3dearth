import { useState, useEffect } from 'react'
import * as topojson from 'topojson-client'

export interface GeoFeature {
  type: 'Feature'
  id: string | number
  properties: {
    name: string
    iso_a3?: string // ISO 3-letter code if available
    [key: string]: any
  }
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: any[]
  }
}

export interface GeoData {
  features: GeoFeature[]
}

// Map ISO-3 country codes to Deldersveld TopoJSON urls
const PROVINCE_MAPS: Record<string, { slug: string; objectName: string }> = {
  TWN: { slug: 'taiwan/taiwan-provinces.json', objectName: 'taiwan-provinces' },
  USA: { slug: 'united-states/us-states.json', objectName: 'states' },
  CHN: { slug: 'china/china-provinces.json', objectName: 'china-provinces' },
  JPN: { slug: 'japan/japan-prefectures.json', objectName: 'japan-prefectures' },
  CAN: { slug: 'canada/canada-provinces.json', objectName: 'canada-provinces' },
  DEU: { slug: 'germany/germany-states.json', objectName: 'germany-states' },
  FRA: { slug: 'france/france-provinces.json', objectName: 'france-provinces' },
  GBR: { slug: 'united-kingdom/united-kingdom-provinces.json', objectName: 'united-kingdom-provinces' },
  IND: { slug: 'india/india-states.json', objectName: 'india-states' },
}

/**
 * Custom hook to load global country level geo data
 */
export function useWorldGeoData() {
  const [data, setData] = useState<GeoData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true
    // Using high quality but lightweight 110m world atlas
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch world geojson')
        return res.json()
      })
      .then((topoData: any) => {
        if (!active) return

        // Decode TopoJSON to GeoJSON
        const decoded = topojson.feature(topoData, topoData.objects.countries) as any

        // Inject ISO code map since world-atlas countries-110m.json uses numeric IDs
        // Let's load the country names lookup file to match ISO-3 codes (using world-atlas@1's TSV mapping)
        return fetch('https://cdn.jsdelivr.net/npm/world-atlas@1/world/110m.tsv')
          .then((res) => {
            if (!res.ok) throw new Error('Failed to fetch world TSV metadata')
            return res.text()
          })
          .then((tsvText) => {
            const rows = tsvText.split('\n').map((row) => row.split('\t'))
            const headers = rows[0]

            const idxIsoN3 = headers.indexOf('iso_n3')
            const idxIsoA3 = headers.indexOf('iso_a3')
            const idxName = headers.indexOf('name')

            const idToIsoMap: Record<number, { name: string; iso: string }> = {}

            for (let i = 1; i < rows.length; i++) {
              const cols = rows[i]
              if (cols.length > idxIsoN3) {
                const n3 = parseInt(cols[idxIsoN3]?.trim())
                const iso = cols[idxIsoA3]?.trim()
                const name = cols[idxName]?.trim()
                if (n3 && iso && name) {
                  idToIsoMap[n3] = { name, iso }
                }
              }
            }

            // Map properties back to decoded features using integer comparison
            decoded.features.forEach((feature: any) => {
              const numericId = parseInt(String(feature.id))
              const lookup = idToIsoMap[numericId]
              if (lookup) {
                feature.properties.name = lookup.name
                feature.properties.iso_a3 = lookup.iso
              }
            })

            setData(decoded)
            setLoading(false)
          })
      })
      .catch((err) => {
        console.error('Error fetching world data:', err)
        if (active) {
          setError(err)
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  return { data, loading, error }
}

/**
 * Custom hook to load state/province level geo data for a specific country
 */
export function useProvinceGeoData(isoCode: string | null) {
  const [data, setData] = useState<GeoData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isoCode) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    const provinceMeta = PROVINCE_MAPS[isoCode.toUpperCase()]
    if (!provinceMeta) {
      setData(null)
      setLoading(false)
      setError(`Province map data is not supported for ${isoCode} yet.`)
      return
    }

    setLoading(true)
    setError(null)
    let active = true

    const url = `https://raw.githubusercontent.com/deldersveld/topojson/master/countries/${provinceMeta.slug}`

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load province data for ${isoCode}`)
        return res.json()
      })
      .then((topoData) => {
        if (!active) return
        const objName = provinceMeta.objectName
        if (!topoData.objects[objName]) {
          throw new Error(`Invalid object name ${objName} in fetched TopoJSON`)
        }

        const decoded = topojson.feature(topoData, topoData.objects[objName]) as any

        // Standardize province property names (usually 'name' or 'NAME_1' or 'province')
        decoded.features.forEach((feature: any) => {
          const props = feature.properties
          props.name = props.name || props.NAME_1 || props.NAME_0 || props.state || props.province || `Region ${feature.id}`
        })

        setData(decoded)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        if (active) {
          setError(`Failed to fetch states/provinces for ${isoCode}`)
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [isoCode])

  return { data, loading, error }
}
