import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politika e Privatësisë | Automotive Marketplace',
  description: 'Lexoni politikën tonë të privatësisë dhe mësoni se si i mbledhim, përdorim dhe mbrojmë të dhënat tuaja personale.'
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Politika e Privatësisë</h1>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Hyrje</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Mirë se vini në Automotive Marketplace. Ne respektojmë privatësinë tuaj dhe jemi të përkushtuar të mbrojmë të dhënat tuaja personale.
                Kjo politikë e privatësisë do t&apos;ju informojë se si ne trajtojmë të dhënat tuaja personale kur vizitoni faqen tonë të internetit
                dhe do t&apos;ju tregojë për të drejtat tuaja të privatësisë dhe se si ligji ju mbron.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Kjo politikë e privatësisë është në përputhje me Rregulloren e Përgjithshme të Mbrojtjes së të Dhënave (GDPR) dhe
                ligjin shqiptar për mbrojtjen e të dhënave personale.
              </p>
            </div>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Të Dhënat që Mbledhim</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Ne mund të mbledhim, përdorim, ruajmë dhe transferojmë lloje të ndryshme të të dhënave personale rreth jush,
                të cilat i kemi grupuar si më poshtë:
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.1 Të Dhëna Identiteti</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Emër dhe mbiemër</li>
                <li>Emër përdoruesi ose identifikues të ngjashëm</li>
                <li>Titull, datëlindje dhe gjini</li>
                <li>Numri i kartës së identitetit (për verifikim)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Të Dhëna Kontakti</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Adresa e faturimit dhe adresa e dorëzimit</li>
                <li>Adresa e emailit</li>
                <li>Numrat e telefonit</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.3 Të Dhëna Financiare</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Detaje të kartës bankare</li>
                <li>Detaje të llogarisë bankare</li>
                <li>Historiku i transaksioneve</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.4 Të Dhëna Teknike</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Adresa IP</li>
                <li>Të dhënat e hyrjes në llogari</li>
                <li>Lloji dhe versioni i shfletuesit</li>
                <li>Cilësimet e zonës kohore dhe vendndodhjes</li>
                <li>Llojet dhe versionet e shtojcave të shfletuesit</li>
                <li>Sistemi operativ dhe platforma</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.5 Të Dhëna Përdorimi</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Informacion se si përdorni faqen tonë, produktet dhe shërbimet</li>
                <li>Faqet e vizituara dhe kohëzgjatja e vizitës</li>
                <li>Kërkimet dhe shpalljet e shikuara</li>
                <li>Interaktimet me shpalljet dhe përdoruesit e tjerë</li>
              </ul>
            </div>
          </section>

          {/* How We Use Data */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Si i Përdorim të Dhënat Tuaja</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Ne do të përdorim të dhënat tuaja personale vetëm kur ligji na lejon. Më së shpeshti,
                ne do të përdorim të dhënat tuaja personale në rrethanat e mëposhtme:
              </p>

              <ul className="list-disc pl-6 space-y-3 text-gray-700">
                <li>
                  <strong>Për të përmbushur një kontratë:</strong> Për të regjistruar llogarinë tuaj,
                  për të publikuar shpalljet tuaja, dhe për të lehtësuar transaksionet midis blerësve dhe shitësve.
                </li>
                <li>
                  <strong>Për interesat tona legjitime:</strong> Për të përmirësuar shërbimet tona,
                  për të analizuar trendet e tregut, dhe për të parandaluar mashtrimet.
                </li>
                <li>
                  <strong>Për të përmbushur detyrimet ligjore:</strong> Për të raportuar pranë autoriteteve
                  kompetente kur kërkohet nga ligji.
                </li>
                <li>
                  <strong>Me pëlqimin tuaj:</strong> Për të dërguar materiale marketingu,
                  ku keni dhënë pëlqimin tuaj.
                </li>
              </ul>
            </div>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Ndarja e të Dhënave me Palët e Treta</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Ne mund të ndajmë të dhënat tuaja personale me palët e treta në rrethanat e mëposhtme:
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.1 Ofruesit e Shërbimeve</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Ne punojmë me kompani të besueshme që na ndihmojnë të operojmë platformën tonë:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Ofruesit e shërbimeve të pagesave (Stripe, PayPal)</li>
                <li>Ofruesit e shërbimeve të emailit dhe SMS-ve</li>
                <li>Ofruesit e hosting-ut dhe ruajtjes së të dhënave</li>
                <li>Shërbimet e analizave dhe performancës</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.2 Përdoruesit e Tjerë</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Kur publikoni një shpallje, informacioni i mëposhtëm bëhet publik:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Emri juaj ose emri i biznesit</li>
                <li>Detajet e kontaktit që zgjidhni të publikoni</li>
                <li>Përmbajtja e shpalljes dhe fotografitë</li>
                <li>Vendndodhja (qyteti)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.3 Autoritetet Ligjore</h3>
              <p className="text-gray-700 leading-relaxed">
                Ne mund të zbulojmë të dhënat tuaja nëse kërkohet nga ligji ose për të mbrojtur
                të drejtat, pronën ose sigurinë tonë, të përdoruesve tanë ose të tjerëve.
              </p>
            </div>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Të Drejtat Tuaja</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Sipas GDPR dhe ligjit shqiptar për mbrojtjen e të dhënave, ju keni të drejtat e mëposhtme:
              </p>

              <ul className="list-disc pl-6 space-y-3 text-gray-700">
                <li>
                  <strong>E drejta e aksesit:</strong> Ju keni të drejtë të kërkoni kopje të të dhënave
                  tuaja personale.
                </li>
                <li>
                  <strong>E drejta e korrigjimit:</strong> Ju keni të drejtë të kërkoni që ne të korrigjojmë
                  çdo informacion që besoni se është i pasaktë ose i paplotë.
                </li>
                <li>
                  <strong>E drejta e fshirjes:</strong> Ju keni të drejtë të kërkoni që ne të fshijmë
                  të dhënat tuaja personale në rrethana të caktuara.
                </li>
                <li>
                  <strong>E drejta e kufizimit të përpunimit:</strong> Ju keni të drejtë të kërkoni
                  që ne të kufizojmë përpunimin e të dhënave tuaja personale në rrethana të caktuara.
                </li>
                <li>
                  <strong>E drejta e kundërshtimit:</strong> Ju keni të drejtë të kundërshtoni
                  përpunimin e të dhënave tuaja personale në rrethana të caktuara.
                </li>
                <li>
                  <strong>E drejta e portabilitetit:</strong> Ju keni të drejtë të kërkoni që ne
                  t&apos;ju transferojmë të dhënat që kemi mbledhur në një organizatë tjetër,
                  ose drejtpërdrejt tek ju, në rrethana të caktuara.
                </li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                Për të ushtruar ndonjë nga këto të drejta, ju lutemi na kontaktoni në adresën
                e emailit: <a href="mailto:privacy@automotivemarketplace.com" className="text-blue-600 hover:underline">
                privacy@automotivemarketplace.com</a>
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies dhe Teknologji të Ngjashme</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Faqja jonë përdor cookies dhe teknologji të ngjashme për të përmirësuar përvojën tuaj.
                Cookies janë skedarë të vegjël teksti që ruhen në kompjuterin ose pajisjen tuaj.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.1 Llojet e Cookies që Përdorim</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Cookies të Nevojshme</h4>
                  <p className="text-gray-700">
                    Këto cookies janë thelbësore për funksionimin e faqes sonë. Ato përfshijnë,
                    për shembull, cookies që ju lejojnë të hyni në zona të sigurta të faqes sonë.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900">Cookies Analitike/Performance</h4>
                  <p className="text-gray-700">
                    Këto cookies na lejojnë të njohim dhe numërojmë vizitorët dhe të shohim
                    se si vizitorët lëvizin përreth faqes sonë. Kjo na ndihmon të përmirësojmë
                    mënyrën se si funksionon faqja jonë.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900">Cookies Funksionaliteti</h4>
                  <p className="text-gray-700">
                    Këto cookies përdoren për t&apos;ju njohur kur ktheheni në faqen tonë.
                    Kjo na mundëson të personalizojmë përmbajtjen tonë për ju dhe të
                    kujtojmë preferencat tuaja.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900">Cookies Targetimi</h4>
                  <p className="text-gray-700">
                    Këto cookies regjistrojnë vizitën tuaj në faqen tonë, faqet që keni vizituar
                    dhe lidhjet që keni ndjekur. Do të përdorim këtë informacion për të bërë
                    faqen tonë dhe reklamat e shfaqura në të më të përshtatshme për interesat tuaja.
                  </p>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mt-4">
                Ju mund të vendosni që shfletuesi juaj të refuzojë të gjitha ose disa cookies,
                ose t&apos;ju njoftojë kur faqet vendosin ose aksesojnë cookies. Nëse çaktivizoni ose
                refuzoni cookies, ju lutemi vini re se disa pjesë të kësaj faqe mund të bëhen
                të paaksesueshme ose mund të mos funksionojnë siç duhet.
              </p>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Siguria e të Dhënave</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Ne kemi vendosur masa të përshtatshme të sigurisë për të parandaluar humbjen aksidentale,
                përdorimin ose aksesin e paautorizuar, ndryshimin ose zbulimin e të dhënave tuaja personale.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                Masat tona të sigurisë përfshijnë:
              </p>

              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Enkriptimi i të dhënave në transit dhe në qetësi</li>
                <li>Autentifikimi me dy faktorë për llogaritë</li>
                <li>Kontrolle të rrepta të aksesit për stafin tonë</li>
                <li>Monitorim i rregullt i sigurisë dhe auditime</li>
                <li>Politika të forta të fjalëkalimeve</li>
                <li>Mbrojtje nga sulmet kibernetike</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                Ne kemi vendosur gjithashtu procedura për të trajtuar çdo shkelje të supozuar të sigurisë
                së të dhënave dhe do t&apos;ju njoftojmë ju dhe çdo rregullator të aplikueshëm për një shkelje
                kur jemi të detyruar ligjërisht ta bëjmë këtë.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Ruajtja e të Dhënave</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Ne do të mbajmë të dhënat tuaja personale vetëm për aq kohë sa është e nevojshme
                për të përmbushur qëllimet për të cilat i kemi mbledhur ato, duke përfshirë qëllimet
                për të përmbushur çdo kërkesë ligjore, kontabël ose raportimi.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                Periudhat tona tipike të ruajtjes janë:
              </p>

              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Të dhënat e llogarisë:</strong> Deri në fshirjen e llogarisë + 12 muaj për qëllime ligjore</li>
                <li><strong>Shpalljet:</strong> 90 ditë pas skadimit ose fshirjes</li>
                <li><strong>Të dhënat e transaksioneve:</strong> 7 vjet për qëllime tatimore dhe kontabël</li>
                <li><strong>Historiku i komunikimit:</strong> 3 vjet</li>
                <li><strong>Të dhënat e marketingut:</strong> Deri në tërheqjen e pëlqimit</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                Pas përfundimit të periudhës së ruajtjes, të dhënat tuaja do të fshihen në mënyrë
                të sigurt ose anonimizuara në mënyrë që të mos mund të identifikoheni.
              </p>
            </div>
          </section>

          {/* International Transfers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Transferimet Ndërkombëtare</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Disa nga ofruesit tanë të jashtëm të shërbimeve mund të jenë vendosur jashtë
                Zonës Ekonomike Evropiane (ZEE). Kur të dhënat tuaja personale transferohen
                jashtë ZEE-së, ne sigurojmë që një shkallë e ngjashme mbrojtjeje të aplikohet
                duke përdorur njërin nga mekanizmat e mëposhtëm:
              </p>

              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Vendimet e adekuatsisë të BE-së për vendin marrës</li>
                <li>Klauzolat kontraktuale standarde të miratuara nga Komisioni Evropian</li>
                <li>Certifikimi Privacy Shield për transferimet në SHBA</li>
                <li>Garanci të tjera të miratuara nga rregullatorët e mbrojtjes së të dhënave</li>
              </ul>
            </div>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Ndryshimet në Politikën e Privatësisë</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Ne mund të përditësojmë këtë politikë privatësie herë pas here në përgjigje të
                ndryshimeve ligjore, teknike ose të biznesit. Kur bëjmë ndryshime, do të
                përditësojmë datën &quot;E përditësuar më&quot; në krye të kësaj politike.
              </p>

              <p className="text-gray-700 leading-relaxed">
                Ju inkurajojmë të rishikoni këtë politikë privatësie rregullisht për të qëndruar
                të informuar se si po i mbrojmë të dhënat tuaja. Ndryshimet materiale do të
                komunikohen përmes emailit ose njoftimeve në faqen tonë.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Kontakti</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Nëse keni pyetje ose shqetësime rreth kësaj politike privatësie ose praktikave
                tona të të dhënave, ju lutemi na kontaktoni:
              </p>

              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-900 font-semibold mb-2">Zyrtari i Mbrojtjes së të Dhënave</p>
                <p className="text-gray-700">Email: <a href="mailto:privacy@automotivemarketplace.com" className="text-blue-600 hover:underline">privacy@automotivemarketplace.com</a></p>
                <p className="text-gray-700">Telefon: +355 XX XXX XXXX</p>
                <p className="text-gray-700">Adresa: Rruga [Emri i Rrugës], Tiranë, Shqipëri</p>
              </div>

              <p className="text-gray-700 leading-relaxed mt-4">
                Ju keni gjithashtu të drejtë të bëni një ankesë në çdo kohë pranë Komisionerit të
                Informacionit për Mbrojtjen e të Dhënave në Shqipëri ose autoritetit tjetër mbikëqyrës
                kompetent nëse konsideroni se të drejtat tuaja të privatësisë janë shkelur.
              </p>
            </div>
          </section>

          {/* Footer Note */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Kjo politikë privatësie është hartuar në përputhje me Rregulloren e Përgjithshme të
              Mbrojtjes së të Dhënave (GDPR) dhe Ligjin Nr. 9887, datë 10.03.2008 &quot;Për mbrojtjen
              e të dhënave personale&quot; i Republikës së Shqipërisë.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
