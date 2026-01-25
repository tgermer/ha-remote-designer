import styles from "./LegalPage.module.css";

type LegalPageKind = "impressum" | "datenschutz";

type ContactInfo = {
    projectName: string;
    name: string;
    addressLines: string[];
    email: string;
    updatedAt: string;
};

type Props = {
    kind: LegalPageKind;
    contact: ContactInfo;
    backHref: string;
    onBack: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function LegalPage({ kind, contact, backHref, onBack }: Props) {
    return (
        <section className={styles.page} aria-label={kind === "impressum" ? "Impressum" : "Datenschutzerklärung"}>
            <div className={styles.header}>
                <p className={styles.kicker}>{contact.projectName}</p>
                <h1 className={styles.title}>{kind === "impressum" ? "Impressum" : "Datenschutzerklärung"}</h1>
                <p className={styles.meta}>Stand: {contact.updatedAt}</p>
                <a className={styles.backLink} href={backHref} onClick={onBack}>
                    Zurück zur App
                </a>
            </div>

            {kind === "impressum" ? (
                <div className={styles.content}>
                    <section className={styles.section}>
                        <h2>Angaben gemäß § 5 DDG</h2>
                        <p>{contact.name}</p>
                        <p>
                            {contact.addressLines.map((line) => (
                                <span key={line} className={styles.blockLine}>
                                    {line}
                                </span>
                            ))}
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Anbieter</h2>
                        <p>{contact.name}</p>
                        <p>
                            {contact.addressLines.map((line) => (
                                <span key={line} className={styles.blockLine}>
                                    {line}
                                </span>
                            ))}
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Kontakt</h2>
                        <p>
                            E-Mail: <a href={`mailto:${contact.email}`}>{contact.email}</a>
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Projekt</h2>
                        <p>
                            {contact.projectName} ist ein privates, nicht-kommerzielles Projekt. Inhalte werden mit größtmöglicher Sorgfalt
                            erstellt, eine Gewähr für Aktualität, Vollständigkeit oder Richtigkeit wird jedoch nicht übernommen.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Verantwortlich für Inhalte</h2>
                        <p>{contact.name}</p>
                        <p>
                            {contact.addressLines.map((line) => (
                                <span key={line} className={styles.blockLine}>
                                    {line}
                                </span>
                            ))}
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Haftung für Inhalte</h2>
                        <p>
                            Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
                            verantwortlich. Nach §§ 8 bis 10 TMG bin ich jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen
                            zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                        </p>
                        <p>
                            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon
                            unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich.
                            Bei Bekanntwerden von entsprechenden Rechtsverletzungen werde ich diese Inhalte umgehend entfernen.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Haftung für Links</h2>
                        <p>
                            Mein Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte ich keinen Einfluss habe. Deshalb kann ich für
                            diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
                            oder Betreiber der Seiten verantwortlich.
                        </p>
                        <p>
                            Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren
                            zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne
                            konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werde ich derartige
                            Links umgehend entfernen.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Urheberrecht</h2>
                        <p>
                            Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die
                            Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der
                            schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten,
                            nicht kommerziellen Gebrauch gestattet.
                        </p>
                        <p>
                            Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet.
                            Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung
                            aufmerksam werden, bitte ich um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werde ich derartige
                            Inhalte umgehend entfernen.
                        </p>
                    </section>
                </div>
            ) : (
                <div className={styles.content}>
                    <section className={styles.section}>
                        <h2>Datenschutz auf einen Blick</h2>
                        <p>
                            Beim Besuch dieser Website werden technisch notwendige Daten (z. B. IP-Adresse, Datum und Uhrzeit des Abrufs, Browsertyp)
                            verarbeitet, um die Seite auszuliefern und ihre Sicherheit zu gewährleisten. Eine Zusammenführung dieser Daten mit anderen
                            Datenquellen findet nicht statt.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Verantwortlicher</h2>
                        <p>{contact.name}</p>
                        <p>
                            {contact.addressLines.map((line) => (
                                <span key={line} className={styles.blockLine}>
                                    {line}
                                </span>
                            ))}
                        </p>
                        <p>
                            E-Mail: <a href={`mailto:${contact.email}`}>{contact.email}</a>
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Hosting</h2>
                        <p>
                            Diese Website wird über Netlify bereitgestellt. Beim Aufruf der Seite werden technisch erforderliche Daten verarbeitet,
                            um die Website auszuliefern und die Sicherheit zu gewährleisten.
                        </p>
                        <p>Empfänger/Kategorien: Hosting-Dienstleister (Netlify) als Auftragsverarbeiter.</p>
                        <p>Netlify, Inc., 101 2nd Street, San Francisco, CA 94105, USA.</p>
                        <p>Mit Netlify besteht ein Vertrag zur Auftragsverarbeitung (Art. 28 DSGVO).</p>
                    </section>

                    <section className={styles.section}>
                        <h2>Server-Logfiles</h2>
                        <p>
                            Beim Zugriff auf die Website können unter anderem IP-Adresse, Datum und Uhrzeit der Anfrage, aufgerufene Seite,
                            Referrer-URL und Informationen zum Browser bzw. Betriebssystem in Logfiles anfallen. Diese Daten dienen ausschließlich
                            der technischen Bereitstellung, Stabilität und Sicherheit.
                        </p>
                        <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherem und stabilem Betrieb).</p>
                        <p>Speicherdauer: Logdaten werden nur solange gespeichert, wie es zur Sicherstellung des Betriebs erforderlich ist.</p>
                    </section>

                    <section className={styles.section}>
                        <h2>Rechtsgrundlagen der Verarbeitung</h2>
                        <p>
                            Soweit im Folgenden keine abweichenden Rechtsgrundlagen genannt sind, erfolgt die Verarbeitung auf Grundlage von Art. 6
                            Abs. 1 lit. f DSGVO (berechtigtes Interesse) zur Bereitstellung, Stabilität und Sicherheit der Website.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Sicherheitslücken-Hinweis</h2>
                        <p>
                            Ich weise darauf hin, dass die Datenübertragung im Internet (z. B. bei der Kommunikation per E-Mail) Sicherheitslücken
                            aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Cookies und Tracking</h2>
                        <p>Es werden keine Cookies gesetzt und kein Tracking oder Analytics eingesetzt.</p>
                    </section>

                    <section className={styles.section}>
                        <h2>Externe Inhalte</h2>
                        <p>Es werden keine externen Inhalte, Schriftarten oder eingebettete Dienste von Drittanbietern geladen.</p>
                        <p>
                            Auf der Website gibt es lediglich einen externen Link zu Buy Me a Coffee. Beim Klick auf den Link werden Sie auf die Website
                            des Anbieters weitergeleitet; dort gilt die jeweilige Datenschutzerklärung.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Widerspruchsrecht</h2>
                        <p>
                            Soweit ich Daten auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO verarbeite, haben Sie jederzeit das Recht, aus Gründen,
                            die sich aus Ihrer besonderen Situation ergeben, gegen diese Verarbeitung Widerspruch einzulegen.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Ihre Rechte</h2>
                        <p>
                            Sie können sich jederzeit an mich wenden, wenn Sie Auskunft, Berichtigung, Löschung oder Einschränkung der Verarbeitung
                            Ihrer Daten wünschen. Zudem können Sie einer Verarbeitung aus Gründen, die sich aus Ihrer besonderen Situation ergeben,
                            widersprechen.
                        </p>
                        <p>Sie haben zudem das Recht auf Datenübertragbarkeit, soweit die Voraussetzungen der DSGVO erfüllt sind.</p>
                        <p>
                            Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, wenn Sie der Ansicht sind, dass die
                            Verarbeitung Ihrer personenbezogenen Daten gegen die DSGVO verstößt.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Drittlandübermittlung</h2>
                        <p>
                            Eine Übermittlung personenbezogener Daten in Drittländer kann durch das Hosting in den USA stattfinden. Netlify setzt für
                            internationale Datenübermittlungen geeignete Garantien ein, insbesondere Standardvertragsklauseln (SCC) der EU-Kommission.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Pflicht zur Bereitstellung von Daten</h2>
                        <p>Es besteht keine gesetzliche oder vertragliche Pflicht, personenbezogene Daten bereitzustellen.</p>
                    </section>

                    <section className={styles.section}>
                        <h2>Automatisierte Entscheidungen</h2>
                        <p>Es findet keine automatisierte Entscheidungsfindung einschließlich Profiling statt.</p>
                    </section>

                    <section className={styles.section}>
                        <h2>Kontakt</h2>
                        <p>
                            Bei Fragen zum Datenschutz schreiben Sie mir bitte an <a href={`mailto:${contact.email}`}>{contact.email}</a>.
                        </p>
                    </section>
                </div>
            )}
        </section>
    );
}
