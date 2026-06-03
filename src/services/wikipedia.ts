export interface WikipediaInfo {
  title: string
  extract: string
  thumbnailUrl?: string
}

// English to Traditional Chinese country translation mapping for high-speed direct queries
export const zhNameMap: Record<string, string> = {
  'Taiwan': '台灣',
  'China': '中國',
  'United States': '美國',
  'Japan': '日本',
  'Russia': '俄羅斯',
  'Canada': '加拿大',
  'Germany': '德國',
  'France': '法國',
  'United Kingdom': '英國',
  'India': '印度',
  'Australia': '澳大利亞',
  'Brazil': '巴西',
  'South Africa': '南非',
  'Italy': '義大利',
  'Spain': '西班牙',
  'South Korea': '韓國',
  'North Korea': '北韓',
  'Mongolia': '蒙古',
  'Vietnam': '越南',
  'Thailand': '泰國',
  'Singapore': '新加坡',
  'Malaysia': '馬來西亞',
  'Indonesia': '印尼',
  'Philippines': '菲律賓',
  'New Zealand': '紐西蘭',
  'Egypt': '埃及',
  'Saudi Arabia': '沙烏地阿拉伯',
  'Turkey': '土耳其',
  'Iran': '伊朗',
  'Iraq': '伊拉克',
  'Mexico': '墨西哥',
  'Argentina': '阿根廷',
  'Greenland': '格陵蘭',
  'Antarctica': '南極洲',
  'Netherlands': '荷蘭',
  'Belgium': '比利時',
  'Switzerland': '瑞士',
  'Sweden': '瑞典',
  'Norway': '挪威',
  'Denmark': '丹麥',
  'Finland': '芬蘭',
  'Poland': '波蘭',
  'Ukraine': '烏克蘭',
  'Greece': '希臘',
  'Portugal': '葡萄牙',
  'Austria': '奧地利',
  'Morocco': '摩洛哥',
  'Cuba': '古巴',
  'Colombia': '哥倫比亞',
  'Peru': '秘魯',
  'Chile': '智利',
  'United Arab Emirates': '阿拉伯聯合大公國',
  'Israel': '以色列',
  'Pakistan': '巴基斯坦',
  'Bangladesh': '孟加拉'
}

/**
 * Fetches summaries and images from Wikipedia for a given place name.
 * Handles API requests with clean error recovery and falls back to a search if exact match fails.
 *
 * @param placeName - The name of the country or administrative province/state
 * @param lang - The language subdomain to use (en or zh)
 * @returns Promise<WikipediaInfo>
 */
export async function fetchWikipediaInfo(placeName: string, lang: 'en' | 'zh' = 'en'): Promise<WikipediaInfo> {
  // Clean up place names for better query success
  let queryName = placeName.trim()
  if (queryName === 'United States of America') queryName = 'United States'
  if (queryName === 'People\'s Republic of China') queryName = 'China'

  if (lang === 'zh') {
    // Translate common English names to Traditional Chinese to query Chinese Wikipedia directly
    const mapped = zhNameMap[queryName]
    if (mapped) {
      queryName = mapped
    }
  }

  const subdomain = lang === 'zh' ? 'zh' : 'en'
  // Added redirects=1 to allow Wikipedia to automatically resolve English-to-Chinese redirects!
  const url = `https://${subdomain}.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=400&origin=*&redirects=1&titles=${encodeURIComponent(queryName)}`

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Wikipedia API error')
    const data = await response.json()

    const pages = data.query?.pages
    if (!pages) throw new Error('No page found')

    const pageId = Object.keys(pages)[0]
    if (pageId === '-1') {
      // If exact title match failed, try doing an open search first
      return fetchWikipediaSearchFallback(queryName, lang)
    }

    const page = pages[pageId]
    return {
      title: page.title,
      extract: page.extract || (lang === 'zh' ? '目前沒有此地點的詳細說明。' : 'No information summary is available for this location.'),
      thumbnailUrl: page.thumbnail?.source
    }
  } catch (error) {
    console.error('Error fetching Wikipedia summary:', error)
    return {
      title: placeName,
      extract: lang === 'zh'
        ? `無法從維基百科取得 "${placeName}" 的資訊。請檢查您的網路連線。`
        : `Failed to retrieve information for "${placeName}" from Wikipedia. Please check your internet connection.`
    }
  }
}

/**
 * Fallback search to find the closest matching Wikipedia page if exact query fails.
 */
async function fetchWikipediaSearchFallback(placeName: string, lang: 'en' | 'zh'): Promise<WikipediaInfo> {
  const subdomain = lang === 'zh' ? 'zh' : 'en'
  const searchUrl = `https://${subdomain}.wikipedia.org/w/api.php?action=opensearch&format=json&limit=1&origin=*&search=${encodeURIComponent(placeName)}`

  try {
    const searchRes = await fetch(searchUrl)
    const searchData = await searchRes.json()
    const bestMatch = searchData[1]?.[0]

    if (bestMatch) {
      return fetchWikipediaInfo(bestMatch, lang)
    }

    return {
      title: placeName,
      extract: lang === 'zh'
        ? `找不到與 "${placeName}" 相關的維基百科文章。`
        : `No Wikipedia article found matching "${placeName}".`
    }
  } catch (e) {
    return {
      title: placeName,
      extract: lang === 'zh'
        ? `搜尋維基百科中的 "${placeName}" 時出錯。`
        : `Failed to search Wikipedia for "${placeName}".`
    }
  }
}
