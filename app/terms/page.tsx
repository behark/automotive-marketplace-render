import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kushtet e Shërbimit | Automotive Marketplace',
  description: 'Lexoni kushtet dhe afatet tona të shërbimit për përdorimin e platformës Automotive Marketplace.'
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Kushtet e Shërbimit</h1>
          <p className="text-lg text-gray-600">
            E përditësuar më: 7 Tetor 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">

          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Pranimi i Kushteve</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Mirë se vini në Automotive Marketplace ("Platforma", "ne", "na" ose "tonë").
                Duke aksesuar ose përdorur platformën tonë, ju pranoni të jeni të lidhur nga
                këto Kushte të Shërbimit ("Kushtet"). Nëse nuk pajtoheni me këto Kushte,
                ju lutemi mos përdorni Platformën tonë.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Këto Kushte përbëjnë një marrëveshje ligjërisht të detyrueshme midis jush
                ("Përdoruesi" ose "ju") dhe Automotive Marketplace. Ju duhet të jeni të paktën
                18 vjeç për të përdorur këtë shërbim.
              </p>
            </div>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Regjistrimi i Llogarisë</h2>
            <div className="prose prose-gray max-w-none">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Krijimi i Llogarisë</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Për të përdorur disa veçori të Platformës, ju duhet të regjistroni një llogari.
                Kur regjistroni një llogari, ju pranoni të:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Të jepni informacion të saktë, aktual dhe të plotë</li>
                <li>Të ruani dhe përditësoni menjëherë informacionin tuaj të llogarisë</li>
                <li>Të ruani sigurinë e fjalëkalimit tuaj dhe të mbani përgjegjësi për të gjitha aktivitetet që ndodhin nën llogarinë tuaj</li>
                <li>Të na njoftoni menjëherë për çdo përdorim të paautorizuar të llogarisë tuaj</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Verifikimi</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Ne rezervojmë të drejtën të kërkojmë verifikimin e identitetit tuaj, duke përfshirë
                por pa u kufizuar në:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Verifikimi i numrit të telefonit</li>
                <li>Verifikimi i adresës së emailit</li>
                <li>Verifikimi i dokumentit të identitetit</li>
                <li>Verifikimi i biznesit (për dyqane dhe dealerë)</li>
                <li>Verifikimi i llogarisë bankare</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.3 Pezullimi dhe Mbyllja e Llogarisë</h3>
              <p className="text-gray-700 leading-relaxed">
                Ne rezervojmë të drejtën të pezullojmë ose mbyllim llogarinë tuaj në çdo kohë,
                pa njoftim paraprak, nëse besojmë se keni shkelur këto Kushte, përfshirë por
                pa u kufizuar në aktivitet mashtruese, shpërndarje të përmbajtjes së paligjshme,
                ose sjellje që dëmton përdoruesit e tjerë.
              </p>
            </div>
          </section>

          {/* Listing Rules */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Rregullat e Shpalljeve</h2>
            <div className="prose prose-gray max-w-none">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Përmbajtja e Shpalljeve</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Kur krijoni një shpallje në Platformën tonë, ju pranoni që:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>I zotëroni ose keni të drejtën ligjore të shisni automjetin e listuar</li>
                <li>Të gjitha informacionet e dhëna janë të sakta dhe të vërteta</li>
                <li>Fotografitë janë autentike dhe paraqesin automjetin aktual</li>
                <li>Çmimi i shpallur është real dhe jo mashtruese</li>
                <li>Nuk do të shisni automjete të vjedhura, të falsifikuara ose të paligjshme</li>
                <li>Do të përmbushni të gjitha kërkesat ligjore për shitjen e automjeteve në Shqipëri</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.2 Përmbajtja e Ndaluar</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Ju nuk lejohet të postoni shpallje që përmbajnë:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Informacion të rremë ose mashtruese</li>
                <li>Përmbajtje fyese, ofenduese ose diskriminuese</li>
                <li>Link ose referenca për faqe të jashtme konkurruese</li>
                <li>Informacion kontakti në fotografitë e shpalljes</li>
                <li>Shpallje dublikate ose spam</li>
                <li>Automjete me dokumentacion të falsifikuar</li>
                <li>Automjete me status të paqartë ligjor</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.3 Moderimi i Përmbajtjes</h3>
              <p className="text-gray-700 leading-relaxed">
                Ne rezervojmë të drejtën të rishikojmë, moderojmë, refuzojmë ose heqim çdo
                shpallje në çdo kohë, pa njoftim paraprak, nëse konsiderojmë se shkel këto
                Kushte ose është e papërshtatshme për ndonjë arsye tjetër.
              </p>
            </div>
          </section>

          {/* Transactions */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Transaksionet dhe Pagesat</h2>
            <div className="prose prose-gray max-w-none">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Roli i Platformës</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Automotive Marketplace është një platformë që lidh blerësit me shitësit.
                Ne nuk jemi palë në transaksionet midis përdoruesve dhe nuk kemi kontroll
                mbi cilësinë, sigurinë ose ligjshmërinë e automjeteve të listuara, aftësinë
                e shitësve për të shitur, ose aftësinë e blerësve për të blerë.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.2 Tarifat dhe Komisionet</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Përdorimi i Platformës mund të kërkojë pagesën e tarifave dhe komisioneve:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Tarifa e shpalljes:</strong> Shpallje të thjeshta bazike janë falas. Shpallje me veçori premium mund të kërkojnë pagesë.</li>
                <li><strong>Komisioni i shitjes:</strong> Një komision prej 3.5% të çmimit të shitjes aplikohet kur automjeti shitet me sukses përmes platformës.</li>
                <li><strong>Shërbime shtesë:</strong> Veçori si promovimi, ngritja e shpalljes, dhe raportimi i avancuar mund të kenë kosto shtesë.</li>
                <li><strong>Abonimi:</strong> Plani Premium, Dealeri dhe Ndërmarrje kanë tarifa mujore/vjetore abonimit.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.3 Metodat e Pagesës</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Ne pranojmë pagesat përmes ofruesve të palëve të treta si Stripe dhe PayPal.
                Duke bërë një pagesë, ju pranoni të jeni të lidhur nga kushtet e shërbimit
                të ofruesit të pagesës.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.4 Rimbursimi</h3>
              <p className="text-gray-700 leading-relaxed">
                Pagesat për shërbimet premium janë përgjithësisht të pa-rimbursueshme.
                Ne mund të ofrojmë rimbursime në bazë rast pas rasti sipas gjykimit tonë të vetëm.
                Komisioni i shitjes nuk rimbursohet pasi shitja të jetë përfunduar.
              </p>
            </div>
          </section>

          {/* User Conduct */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Sjellja e Përdoruesit</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Kur përdorni Platformën, ju pranoni të mos:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Shkelni ndonjë ligj ose rregullore lokale, shtetërore, kombëtare ose ndërkombëtare</li>
                <li>Shfrytëzoni, dëmtoni ose përpiqeni të dëmtoni të mitur në çfarëdo mënyre</li>
                <li>Transmetoni ose prokuroni dërgimin e çdo materiali reklamues ose promovues</li>
                <li>Imitoni ose përpiqeni të imitoni Platformën, një përdorues tjetër, ose çdo person ose entitet</li>
                <li>Përdorni çdo robot, spider, ose pajisje tjetër të automatizuar për të aksesuar Platformën</li>
                <li>Ndërhyni ose përpiqeni të ndërhyni me funksionimin e duhur të Platformës</li>
                <li>Anashkaloni çdo masë që mund të përdoret për të parandaluar ose kufizuar aksesin në Platformë</li>
                <li>Ngacmoni, abuzoni, kërcënoni ose frikësoni përdoruesit e tjerë</li>
                <li>Përdorni Platformën për qëllime mashtrimi ose të paligjshme</li>
                <li>Mbledhni informacion personal nga përdoruesit e tjerë pa pëlqim</li>
              </ul>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Pronësia Intelektuale</h2>
            <div className="prose prose-gray max-w-none">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Përmbajtja e Platformës</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Platforma dhe përmbajtja e saj, duke përfshirë por pa u kufizuar në tekst,
                grafikë, imazhe, logo, ikona, software dhe dizajn, janë pronë e Automotive
                Marketplace ose licensuesve tanë dhe janë të mbrojtura nga ligjet e pronësisë
                intelektuale.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.2 Përmbajtja e Përdoruesit</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Duke postuar përmbajtje në Platformë (shpallje, fotografi, komente, etj.),
                ju na jepni një licencë botërore, jo-ekskluzive, të lirë nga royalties, të
                transferueshme për të përdorur, riprodhuar, shpërndarë, përshtatur, dhe
                shfaqur atë përmbajtje në lidhje me funksionimin e Platformës.
              </p>

              <p className="text-gray-700 leading-relaxed">
                Ju garantoni dhe deklaroni se i zotëroni ose keni të drejtat e nevojshme
                për përmbajtjen që postoni dhe se përmbajtja juaj nuk shkel të drejtat e
                pronësisë intelektuale të ndonjë pale të tretë.
              </p>
            </div>
          </section>

          {/* Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Kufizimi i Përgjegjësisë</h2>
            <div className="prose prose-gray max-w-none">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 Përjashtimi i Garancive</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Platforma ofrohet "siç është" dhe "siç është në dispozicion" pa garanci të çfarëdo lloji,
                qoftë të shprehura ose të nënkuptuara. Ne nuk garantojmë që:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Platforma do të funksionojë pa ndërprerje ose pa gabime</li>
                <li>Gabimet do të korrigjohen</li>
                <li>Platforma ose serverat që e bëjnë atë të disponueshëm janë të lirë nga viruse ose komponentë të dëmshëm</li>
                <li>Përmbajtja e postuar nga përdoruesit është e saktë ose e besueshme</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">7.2 Kufizimi i Dëmeve</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Në asnjë rast Automotive Marketplace, drejtuesit, punonjësit, partnerët, agjentët,
                furnizuesit, ose të afërmit tanë nuk do të jenë përgjegjës për:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Dëme indirekte, incidentale, speciale, pasojore ose dënuese</li>
                <li>Humbje të të ardhurave, fitimeve, të mirave, përdorimit, të dhënave</li>
                <li>Dëme që rezultojnë nga transaksionet midis përdoruesve</li>
                <li>Dëme që rezultojnë nga përdorimi i paautorizuar i llogarisë tuaj</li>
                <li>Dëme që rezultojnë nga gabime, gabimet, ose pasaktësitë e përmbajtjes</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                Përgjegjësia jonë totale ndaj jush për të gjitha pretendimet që lindin nga ose
                në lidhje me këto Kushte ose Platformën nuk do të kalojë shumën që keni paguar
                për ne në 12 muajt e fundit, ose 100 EUR, cilado është më e madhe.
              </p>
            </div>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Kompensimi</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Ju pranoni të mbrojni, kompensoni dhe mbani të padëmshëm Automotive Marketplace
                dhe të afërmit, drejtuesit, punonjësit, partnerët, agjentët, dhe licensuesit tanë
                nga dhe kundër çdo pretendimi, humbje, përgjegjësie, dëme, dhe shpenzime
                (duke përfshirë tarifat e arsyeshme ligjore) që lindin nga ose në lidhje me:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-4">
                <li>Përdorimi juaj i Platformës</li>
                <li>Shkelja juaj e këtyre Kushteve</li>
                <li>Përmbajtja që postoni në Platformë</li>
                <li>Shkelja juaj e të drejtave të çdo pale të tretë</li>
                <li>Transaksionet tuaja me përdoruesit e tjerë</li>
              </ul>
            </div>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Ndërprerja</h2>
            <div className="prose prose-gray max-w-none">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">9.1 Ndërprerja nga Ju</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Ju mund të ndërprisni llogarinë tuaj në çdo kohë duke na kontaktuar ose duke
                përdorur veçoritë e ndërprerjes brenda parametrave të llogarisë. Pas ndërprerjes,
                shpalljet tuaja do të hiqen dhe nuk do të keni më akses në llogarinë tuaj.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">9.2 Ndërprerja nga Ne</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Ne mund të ndërpresim ose pezullojmë llogarinë tuaj dhe aksesin në Platformë
                menjëherë, pa njoftim paraprak ose përgjegjësi, për çdo arsye, duke përfshirë
                pa kufizim nëse ju shkelni këto Kushte.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">9.3 Efekti i Ndërprerjes</h3>
              <p className="text-gray-700 leading-relaxed">
                Pas ndërprerjes, e drejta juaj për të përdorur Platformën do të ndërpritet
                menjëherë. Të gjitha dispozitat e këtyre Kushteve që sipas natyrës së tyre
                duhet të mbijetojnë ndërprerjen do të mbijetojnë, duke përfshirë por pa u
                kufizuar në dispozitat e pronësisë, përjashtimet e garancisë, dhe kufizimet
                e përgjegjësisë.
              </p>
            </div>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Ligji Qeverisës dhe Zgjidhja e Mosmarrëveshjeve</h2>
            <div className="prose prose-gray max-w-none">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">10.1 Ligji Qeverisës</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Këto Kushte do të qevërisen dhe interpretohen në përputhje me ligjet e
                Republikës së Shqipërisë, pa marrë parasysh dispozitat e tij të konfliktit të ligjeve.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">10.2 Zgjidhja e Mosmarrëveshjeve</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Çdo mosmarrëveshje që lind nga ose në lidhje me këto Kushte do të zgjidhet fillimisht
                përmes negociatave miqësore. Nëse negociatat dështojnë brenda 30 ditëve, mosmarrëveshja
                do t'i nënshtrohet juridiksionit ekskluziv të gjykatave të Tiranës, Shqipëri.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">10.3 Zgjidhja Alternative e Mosmarrëveshjeve</h3>
              <p className="text-gray-700 leading-relaxed">
                Ne inkurajojmë përdoruesit të zgjedhin mosmarrëveshjet e tyre përmes mediacionit
                ose arbitrazhit para fillimit të procedurave gjyqësore. Ne mund të ofrojmë
                shërbime të mediacionit për të ndihmuar në zgjidhjen e mosmarrëveshjeve midis
                blerësve dhe shitësve.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Ndryshimet në Kushtet e Shërbimit</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Ne rezervojmë të drejtën të modifikojmë ose zëvendësojmë këto Kushte në çdo kohë
                sipas gjykimit tonë të vetëm. Nëse një rishikim është material, ne do të përpiqemi
                të ofrojmë njoftim të paktën 30 ditë para se çdo Kushte të reja të hyjnë në fuqi.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Duke vazhduar të aksesoni ose përdorni Platformën tonë pas që ato rishikime të hyjnë
                në fuqi, ju pranoni të jeni të lidhur nga Kushtet e rishikuara. Nëse nuk pajtoheni
                me Kushtet e reja, ju nuk jeni më të autorizuar të përdorni Platformën.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Kontakti</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Nëse keni pyetje ose shqetësime rreth këtyre Kushteve, ju lutemi na kontaktoni:
              </p>

              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-900 font-semibold mb-2">Automotive Marketplace</p>
                <p className="text-gray-700">Email: <a href="mailto:support@automotivemarketplace.com" className="text-blue-600 hover:underline">support@automotivemarketplace.com</a></p>
                <p className="text-gray-700">Telefon: +355 XX XXX XXXX</p>
                <p className="text-gray-700">Adresa: Rruga [Emri i Rrugës], Tiranë, Shqipëri</p>
                <p className="text-gray-700 mt-2">Orari i punës: E Hënë - E Premte, 09:00 - 18:00</p>
              </div>
            </div>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Ndarueshmëria</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Nëse ndonjë dispozitë e këtyre Kushteve konsiderohet e pazbatueshme ose e pavlefshme,
                atëherë ajo dispozitë do të kufizohet ose eliminohet në masën minimale të nevojshme,
                dhe dispozitat e mbetura të këtyre Kushteve do të mbeten në fuqi dhe efekt të plotë.
              </p>
            </div>
          </section>

          {/* Entire Agreement */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Marrëveshja e Plotë</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Këto Kushte përbëjnë marrëveshjen e plotë midis jush dhe Automotive Marketplace
                në lidhje me përdorimin tuaj të Platformës dhe zëvendësojnë të gjitha marrëveshjet
                e mëparshme dhe bashkëkohore, qofshin me gojë apo me shkrim, në lidhje me lëndën
                e tyre.
              </p>
            </div>
          </section>

          {/* Footer Note */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Këto Kushte të Shërbimit janë hartuar në përputhje me Kodin Civil të Republikës
              së Shqipërisë dhe legjislacionin e zbatueshëm për tregtinë elektronike dhe
              mbrojtjen e konsumatorit.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
