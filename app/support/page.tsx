'use client'

import { useState } from 'react'

interface FAQItem {
  id: number
  question: string
  answer: string
  category: 'buying' | 'selling' | 'account' | 'payment' | 'technical'
}

const faqs: FAQItem[] = [
  // Buying
  {
    id: 1,
    category: 'buying',
    question: 'Si mund të bëj një blerje të sigurt në platformë?',
    answer: 'Për një blerje të sigurt, rekomandojmë: (1) Takohuni gjithmonë me shitësin në një vend publik dhe të sigurt, (2) Kontrolloni dokumentacionin e automjetit para se të bëni pagesën, (3) Kërkoni një inspektim teknik nga një mekanik i pavarur, (4) Përdorni shërbimin tonë të escrow-it për transaksione mbi €10,000, (5) Verifikoni identitetin e shitësit përmes statusit të verifikimit në profilin e tij.'
  },
  {
    id: 2,
    category: 'buying',
    question: 'A mund të negocioj çmimin me shitësin?',
    answer: 'Po, absolutisht! Shumica e shitësve janë të hapur për negociata. Mund të kontaktoni shitësin direkt përmes butonit "Kontakto Shitësin" në faqen e shpalljes. Jini të sjellshëm dhe profesional në komunikimet tuaja për rezultate më të mira.'
  },
  {
    id: 3,
    category: 'buying',
    question: 'Si mund të verifikoj historikun e një automjeti?',
    answer: 'Ne rekomandojmë disa hapa: (1) Kërkoni raportin e historisë së automjetit duke përdorur numrin VIN, (2) Kontrolloni regjistrat e mirëmbajtjes dhe dokumentacionin e shërbimit, (3) Verifikoni që automjeti nuk është i vjedhur përmes bazës sonë të të dhënave, (4) Shikoni nëse automjeti ka certifikatë inspektimi teknik të vlefshme, (5) Pyesni për çdo aksident të mëparshëm ose dëmtim të rëndësishëm.'
  },
  {
    id: 4,
    category: 'buying',
    question: 'Çfarë duhet të kontrolloj gjatë inspektimit të makinës?',
    answer: 'Elementet kryesore për të kontrolluar përfshijnë: (1) Gjendja e motorit dhe transmetimi, (2) Funksionimi i frenave dhe pezullimit, (3) Goma dhe rrotat, (4) Sistemi elektrik dhe elektronik, (5) Korrozioni dhe dëmtimet në karoserí, (6) Dokumentacioni dhe numri VIN që përputhet, (7) Test-drive për të vlerësuar performancën. Konsideroni të kontraktoni një mekanik profesional për inspektim të plotë.'
  },
  {
    id: 5,
    category: 'buying',
    question: 'A ofron platforma garanci për automjetet?',
    answer: 'Platforma nuk ofron garanci direkt, pasi ne jemi vetëm një ndërmjetës midis blerësve dhe shitësve. Megjithatë, shumë dealerë dhe shitës profesionistë ofrojnë garancinë e tyre. Gjithmonë pyesni shitësin nëse ofrohet garanci dhe kërkoni detajet me shkrim. Për blerje të mëdha, rekomandojmë të konsideroni blerjen e një garancie të zgjeruar.'
  },

  // Selling
  {
    id: 6,
    category: 'selling',
    question: 'Sa kushton të publikosh një shpallje?',
    answer: 'Shpalljet bazike janë falas! Ju mund të publikoni deri në 3 shpallje falas në të njëjtën kohë. Oferojmë gjithashtu shërbime premium: Shpallje e promovuar (€15/muaj), Shpallje e ngritur (€5/ngritje), Shpallje në faqen kryesore (€30/muaj). Dealerët dhe shitësit profesionistë mund të përfitojnë nga planet tona të abonimit me tarifa më të ulëta dhe veçori shtesë.'
  },
  {
    id: 7,
    category: 'selling',
    question: 'Sa kohë zgjat shpallja ime?',
    answer: 'Shpalljet standarde janë aktive për 90 ditë. Para se të skadojë shpallja, do të merrni njoftim me email për ta rinovuar atë. Mund të rinovoni shpalljen falas për 90 ditë shtesë. Nëse automjeti shitet, ju lutemi shënojeni shpalljen si "E Shitur" për të ndihmuar përdoruesit e tjerë.'
  },
  {
    id: 8,
    category: 'selling',
    question: 'Si mund të bëj që shpallja ime të dallohet?',
    answer: 'Këshilla për një shpallje të suksesshme: (1) Përdorni fotografi me cilësi të lartë nga këndvështrime të ndryshme (minimum 5-10 fotografi), (2) Shkruani një përshkrim të detajuar dhe të ndershëm, (3) Vendosni një çmim kompetitiv bazuar në trendet e tregut, (4) Përditësoni rregullisht shpalljen, (5) Përgjigjuni shpejt mesazheve, (6) Konsideroni shërbimet premium si promovimi ose ngritja e shpalljes për më shumë vizibilitet.'
  },
  {
    id: 9,
    category: 'selling',
    question: 'Si funksionon komisioni i shitjes?',
    answer: 'Kur shisni një automjet me sukses përmes platformës sonë, aplikohet një komision prej 3.5% mbi çmimin e shitjes. Për shembull, nëse shisni një makinë për €10,000, komisioni do të jetë €350. Komisioni paguehet vetëm pasi shitja të jetë konfirmuar dhe automjeti të jetë transferuar me sukses. Dealerët me plan abonimenti marrin tarifa më të ulëta komisioni.'
  },
  {
    id: 10,
    category: 'selling',
    question: 'Si mund të tërheq më shumë blerës për shpalljen time?',
    answer: 'Strategji për të tërhequr blerës: (1) Çmimi kompetitiv - përdorni mjetet tona të analizës së çmimeve, (2) Fotografi profesionale - shfaqni automjetin nga këndvështrime të ndryshme në dritë të mirë, (3) Përshkrim i plotë - përfshini të gjitha detajet teknike dhe historinë, (4) Përgjigje të shpejta - përgjigjuni mesazheve brenda 24 orëve, (5) Fleksibilitet - jini të hapur për takime në kohë të ndryshme, (6) Transparencë - jini të sinqertë për çdo defekt ose problem, (7) Dokumentacion i plotë - keni të gjitha dokumentet gati.'
  },

  // Account
  {
    id: 11,
    category: 'account',
    question: 'Si mund të verifikoj llogarinë time?',
    answer: 'Verifikimi i llogarisë rrit besueshmërinë dhe sigurinë tuaj. Hapat për verifikim: (1) Verifikoni adresën tuaj të emailit (bëhet automatikisht gjatë regjistrimit), (2) Verifikoni numrin e telefonit - do të merrni një kod SMS, (3) Verifikoni identitetin - ngarkoni një foto të kartës së identitetit ose pasaportës, (4) Verifikim i biznesit (për dealerë) - ngarkoni regjistrin tregtar. Llogaritë e verifikuara marrin një shenjë të gjelbër dhe kanë përparësi në rezultatet e kërkimit.'
  },
  {
    id: 12,
    category: 'account',
    question: 'Kam harruar fjalëkalimin tim. Çfarë të bëj?',
    answer: 'Nëse keni harruar fjalëkalimin, klikoni në "Keni harruar fjalëkalimin?" në faqen e hyrjes. Do të merrni një email me një lidhje për të rivendosur fjalëkalimin tuaj. Lidhja është e vlefshme për 24 orë. Nëse nuk merrni email-in, kontrolloni dosjen e spam-it ose na kontaktoni për ndihmë.'
  },
  {
    id: 13,
    category: 'account',
    question: 'Si mund të fshij llogarinë time?',
    answer: 'Për të fshirë llogarinë tuaj, shkoni te Cilësimet > Llogaria > Fshi Llogarinë. Vini re që fshirja e llogarisë është e përhershme dhe nuk mund të zhbëhet. Të gjitha shpalljet tuaja do të hiqen dhe nuk do të keni më akses në mesazhet ose të dhënat e llogarisë. Nëse keni pagesa ose shitje të papërfunduara, duhet t\'i përfundoni ato para se të fshini llogarinë.'
  },

  // Payment
  {
    id: 14,
    category: 'payment',
    question: 'Cilat metoda pagese pranoni?',
    answer: 'Ne pranojmë metodat e mëposhtme të pagesës: (1) Karta krediti/debiti (Visa, Mastercard, Maestro), (2) PayPal, (3) Transfertë bankare (për shuma më të mëdha), (4) Pagesa lokale përmes ofruesve shqiptarë të pagesave. Të gjitha transaksionet përpunohen nëpërmes ofruesve të sigurt të pagesave dhe të dhënat tuaja financiare nuk ruhen në serverat tanë.'
  },
  {
    id: 15,
    category: 'payment',
    question: 'A është e sigurt të bëj pagesa online në platformë?',
    answer: 'Po, absolutisht! Ne përdorim enkriptim SSL 256-bit për të mbrojtur të gjitha transaksionet. Pagesat përpunohen nga Stripe dhe PayPal, ofrues të certifikuar dhe të njohur botërisht. Ne nuk ruajmë asnjëherë informacionin tuaj të plotë të kartës. Për transaksione të mëdha (mbi €10,000), rekomandojmë përdorimin e shërbimit tonë të escrow-it për siguri shtesë.'
  },
  {
    id: 16,
    category: 'payment',
    question: 'Si funksionon shërbimi i escrow-it?',
    answer: 'Shërbimi i escrow-it ofron mbrojtje për blerës dhe shitës: (1) Blerësi depoziton paratë në llogarinë tonë të escrow-it, (2) Shitësi transferon automjetin dhe dokumentacionin, (3) Blerësi inspekton automjetin dhe konfirmon gjendjen, (4) Pasi të konfirmohet gjithçka, lëshohen paratë për shitësin. Nëse ka problem, mund të hapet një kontestim që do të mediojmë. Tarifa e escrow-it është 2% e çmimit të shitjes, e ndarë mes blerësit dhe shitësit.'
  },

  // Technical
  {
    id: 17,
    category: 'technical',
    question: 'Pse nuk po ngarkohen fotografitë e mia?',
    answer: 'Probleme të zakonshme me ngarkimin e fotografive: (1) Madhësia e skedarit është shumë e madhe - maksimumi është 10MB për fotografi, (2) Formati i gabuar - pranojmë JPG, PNG, dhe WebP, (3) Lidhje e dobët interneti - provoni të rifreskoni faqen, (4) Shfletuesi ka probleme - pastroni cache-in dhe cookies, (5) Keni arritur limitin - maksimumi është 20 fotografi për shpallje. Nëse problemi vazhdon, na kontaktoni me detaje për ndihmë teknike.'
  },
  {
    id: 18,
    category: 'technical',
    question: 'Si mund të raportoj një shpallje të dyshimtë?',
    answer: 'Nëse gjeni një shpallje që ju duket e dyshimtë ose mashtruese, klikoni butonin "Raporto" në shpallje. Do të keni mundësi të zgjidhni arsyen (çmim i dyshimtë, fotografi të vjedhura, informacion i rremë, etj.) dhe të shtoni detaje shtesë. Ekipi ynë do të hetojë raportin brenda 24-48 orëve. Të gjitha raportimet mbahen konfidenciale.'
  },
  {
    id: 19,
    category: 'technical',
    question: 'A mund të përdor platformën në celular?',
    answer: 'Po! Platforma jonë është plotësisht e optimizuar për pajisje mobile. Mund ta aksesoni përmes çdo shfletuesi në smartphone ose tablet. Ju mund të shfletoni shpallje, të publikoni shpallje të reja, të ngarkoni fotografi, të dërgoni mesazhe, dhe të menaxhoni llogarinën tuaj direkt nga celulari. Për përvojë më të mirë, përdorni versionet më të fundit të Chrome, Safari, ose Firefox.'
  },
  {
    id: 20,
    category: 'technical',
    question: 'Si mund të marr njoftime për shpallje të reja?',
    answer: 'Për të marrë njoftime për shpallje që ju interesojnë: (1) Krijoni një kërkim të ruajtur me kriteret tuaja (marka, modeli, çmimi, etj.), (2) Aktivizoni njoftimet për kërkimin tuaj, (3) Zgjidhni frekuencën - menjëherë, ditore, ose javore, (4) Do të merrni email ose SMS kur shpallje të reja që përputhen me kriteret tuaja publikohen. Mund të menaxhoni njoftimet tuaja nga Cilësimet > Njoftime.'
  }
]

const categories = [
  { id: 'all', name: 'Të Gjitha', icon: '📋' },
  { id: 'buying', name: 'Blerja', icon: '🛒' },
  { id: 'selling', name: 'Shitja', icon: '🏷️' },
  { id: 'account', name: 'Llogaria', icon: '👤' },
  { id: 'payment', name: 'Pagesat', icon: '💳' },
  { id: 'technical', name: 'Teknik', icon: '⚙️' }
]

export default function SupportPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [openFAQs, setOpenFAQs] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const toggleFAQ = (id: number) => {
    const newOpenFAQs = new Set(openFAQs)
    if (newOpenFAQs.has(id)) {
      newOpenFAQs.delete(id)
    } else {
      newOpenFAQs.add(id)
    }
    setOpenFAQs(newOpenFAQs)
  }

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Si Mund t'ju Ndihmojmë?</h1>
            <p className="text-xl text-blue-100 mb-8">
              Gjeni përgjigje për pyetjet tuaja ose na kontaktoni drejtpërdrejt
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Kërkoni për ndihmë..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pl-14 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Contact Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Email</h3>
            <p className="text-gray-600 mb-4">Dërgoni pyetjen tuaj dhe do t'ju përgjigjemi brenda 24 orëve</p>
            <a href="mailto:support@automotivemarketplace.com" className="text-blue-600 hover:underline">
              support@automotivemarketplace.com
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Telefon</h3>
            <p className="text-gray-600 mb-4">Flisni me ekipin tonë të mbështetjes</p>
            <a href="tel:+355XXXXXXXX" className="text-blue-600 hover:underline block">
              +355 XX XXX XXXX
            </a>
            <p className="text-sm text-gray-500 mt-2">E Hënë - E Premte, 09:00 - 18:00</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Chat në Drejtpërdrejtë</h3>
            <p className="text-gray-600 mb-4">Bisedoni me ne në kohë reale</p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Fillo Chat
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pyetje të Bëra Shpesh (FAQ)</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 text-lg">Nuk u gjet asnjë rezultat për kërkimin tuaj.</p>
              <p className="text-gray-500 mt-2">Provoni të përdorni fjalë kyçe të ndryshme ose na kontaktoni drejtpërdrejt.</p>
            </div>
          ) : (
            filteredFAQs.map(faq => {
              const isOpen = openFAQs.has(faq.id)
              return (
                <div key={faq.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                    <svg
                      className={`w-6 h-6 text-gray-500 flex-shrink-0 transition-transform ${
                        isOpen ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Additional Help Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Ende keni pyetje?</h3>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Nëse nuk gjetët përgjigjen që kërkoni, ekipi ynë i mbështetjes është gati të ju ndihmojë.
            Na kontaktoni dhe ne do t'ju përgjigjemi sa më shpejt që të jetë e mundur.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@automotivemarketplace.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Dërgo Email
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Formi i Kontaktit
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
