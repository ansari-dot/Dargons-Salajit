import React from "react";
import "./lab-reports.css";

export default function LabReportsPage() {
  return (
    <div className="tm-page">
    <div className="tm-sale">MID-SEASON SALE UP TO 70% OFF. USE CODE: "SALE70". <a href="/shop">SHOP NOW</a></div>
    <header className="tm-header">
    <div className="tm-logo"><strong>Palses</strong><span>PURE WELLNESS</span></div>
    <div className="tm-header-main">
    <div className="tm-topline"><span>Order online or call us <b>+92 300 1234567</b></span><span className="tm-search">Search all products…</span></div>
    <nav className="tm-nav" aria-label="Main">
    <a href="/">Home</a><a href="/about">About</a><a href="/shop">Shop</a><a href="/gallery">Gallery</a><a href="/blogs">Blogs</a><a href="/calculator">Calculator</a><a href="/certifications">Certifications</a><a href="/lab-reports" className="is-active">Lab Reports</a><a href="/trademark">Trademark</a><a href="/contact-us">Contact Us</a>
    </nav>
    </div>
    </header>
    <section className="tm-hero">
    <div className="tm-eyebrow">● Independent Testing</div>
    <h1 className="tm-title">Lab Reports</h1>
    <p className="tm-sub">Third-Party Tested for Purity, Safety &amp; Quality Standards.</p>
    <div className="tm-rule"></div>
    </section>
    <section className="lr-intro">
    <div>
    <p>Healing Shilajit™ is independently analyzed by AGROLAB LUFA GmbH (Germany) — a DAkkS-accredited European laboratory operating under strict EU analytical standards.</p>
    <p>Every production batch of our Himalayan Shilajit resin undergoes comprehensive third-party testing to verify purity, safety, and compliance.</p>
    <h3>Each lot is screened for</h3>
    <ul className="lr-list">
    <li>Heavy metals (Lead, Cadmium, Mercury, Arsenic)</li>
    <li>Pesticide residues (multi-residue screening)</li>
    <li>Aflatoxins &amp; mycotoxins</li>
    <li>Polycyclic Aromatic Hydrocarbons (PAH)</li>
    <li>Pyrrolizidine alkaloids</li>
    <li>Mineral and ash composition</li>
    </ul>
    <p>All tested parameters comply with applicable EU regulatory limits for analyzed substances.</p>
    </div>
    <div className="lr-panel">
    <h3>Methods used</h3>
    <ul className="lr-list">
    <li>DIN EN laboratory methods</li>
    <li>VO (EU) 2023/915</li>
    <li>LC-MS/MS screening protocols</li>
    <li>Accredited DAkkS laboratory procedures</li>
    </ul>
    <p>This ensures our Shilajit meets strict European safety requirements for quality-controlled dietary supplements.</p>
    <h3>Safety depends on</h3>
    <ul className="lr-list">
    <li>Responsible sourcing</li>
    <li>Controlled purification</li>
    <li>Batch traceability</li>
    <li>Independent laboratory verification</li>
    </ul>
    <p>We believe transparency builds trust.</p>
    <div className="lr-tag">Healing Shilajit™ — Lab Tested. EU Verified. Mountain Sourced.</div>
    </div>
    </section>
    <section className="lr-stack">
    <article className="lr-block">
    <div>
    <h2>Independent AGROLAB Laboratory Test Report for Himalayan Shilajit</h2>
    <h3>Tested parameters</h3>
    <ul className="lr-list">
    <li>Heavy Metals</li>
    <li>Mycotoxins &amp; Aflatoxins (B1, B2, G1, G2)</li>
    <li>PAHs (including Benzo[a]pyrene)</li>
    <li>Pyrrolizidine Alkaloids</li>
    <li>Multi-residue Pesticide Screening</li>
    </ul>
    <h3>Key findings</h3>
    <ul className="lr-list checks">
    <li>No pesticides detected above limit</li>
    <li>Aflatoxins not detected</li>
    <li>PAHs within EU safe limits</li>
    <li>Pyrrolizidine alkaloids not quantifiable</li>
    </ul>
    </div>
    <div className="lr-media">
    <a href="/agrolabs"><img src="https://cdn.shopify.com/s/files/1/0720/3409/1309/files/gempages_538536067247113363-77d508e4-7126-4a3b-9275-597e3886718a.jpg" alt="AGROLAB test report" /></a>
    <div className="lr-hint">Click on the report to explore more.</div>
    </div>
    </article>
    <article className="lr-block flip">
    <div>
    <h2>Heavy Metals – Eurofins (USA)</h2>
    <h3>Laboratory</h3>
    <p>Eurofins Food Integrity &amp; Innovation – Madison, USA<br />Method: ICP Mass Spectrometry (AOAC Official Methods)</p>
    <h3>Results (per serving)</h3>
    <table className="lr-table">
    <thead><tr><th>Element</th><th>Result</th></tr></thead>
    <tbody>
    <tr><td>Arsenic</td><td>0.213 mcg</td></tr>
    <tr><td>Cadmium</td><td>0.0146 mcg</td></tr>
    <tr><td>Lead</td><td>0.0367 mcg</td></tr>
    </tbody>
    </table>
    <div className="lr-concl"><b>Conclusion:</b> Heavy metals tested and within international dietary supplement safety ranges.</div>
    </div>
    <div className="lr-media"><img src="https://cdn.shopify.com/s/files/1/0720/3409/1309/files/Untitled_design_39.jpg" alt="Eurofins heavy metals report" /></div>
    </article>
    <article className="lr-block">
    <div>
    <h2>Microbiology &amp; GMO Testing – Bureau Veritas</h2>
    <h3>Microbiological results</h3>
    <ul className="lr-list">
    <li>Salmonella: Not detected</li>
    <li>E. coli: &lt;10 cfu/g</li>
    <li>Coliforms: &lt;10 cfu/g</li>
    <li>Bacillus cereus: &lt;10 cfu/g</li>
    <li>Aerobic Plate Count: Within safe limits</li>
    </ul>
    <h3>GMO screening</h3>
    <ul className="lr-list">
    <li>p35S: Not detected</li>
    <li>tNOS: Not detected</li>
    <li>FMV: Not detected</li>
    </ul>
    </div>
    <div className="lr-media">
    <img src="https://cdn.shopify.com/s/files/1/0720/3409/1309/files/Untitled_design_38.png" alt="Bureau Veritas microbiology report" />
    <div className="lr-hint">Click on the report to explore more.</div>
    </div>
    </article>
    <article className="lr-block flip">
    <div>
    <h2>Accelerated Shelf Life Study – 3 Years Confirmed</h2>
    <h3>Testing conditions</h3>
    <p>45°C temperature, 60% RH humidity</p>
    <h3>Model applied</h3>
    <p>Arrhenius Equation Stability Model</p>
    <h3>Result</h3>
    <p>Stable for 1095 days (3 years) at room temperature.</p>
    <div className="lr-concl"><b>Conclusion:</b> No unusual chemical or microbiological changes observed.</div>
    </div>
    <div className="lr-panel">
    <h3>Healing Shilajit™ Shelf Life &amp; Stability Report</h3>
    <p>According to the independent laboratory report (Bureau Veritas – Report No. 1086405), Healing Shilajit™ demonstrates a recommended shelf life of 1095 days (3 years) when stored at room temperature.</p>
    <h3>Key findings</h3>
    <ul className="lr-list checks">
    <li>No Salmonella detected</li>
    <li>E. coli &lt;10 cfu/g</li>
    <li>Coliforms &lt;10 cfu/g</li>
    <li>Bacillus cereus &lt;10 cfu/g</li>
    <li>GMO markers not detected</li>
    <li>No unusual physical or chemical deterioration</li>
    <li>Stable sensory characteristics</li>
    </ul>
    <h3>Storage recommendation</h3>
    <p>Store in a cool, dry place at room temperature. No refrigeration required. Avoid excessive heat or direct sunlight.</p>
    </div>
    </article>
    <article className="lr-block">
    <div>
    <h2>Fulvic &amp; Humic Acid Profile – AGROLAB</h2>
    <div className="lr-stats">
    <div><b>56.8%</b>Fulvic Acid</div>
    <div><b>2.9%</b>Humic Acid</div>
    <div><b>59.7%</b>Total Humic + Fulvic</div>
    </div>
    <p>Method: UPLC-UV (274 nm)</p>
    <div className="lr-concl"><b>Conclusion:</b> High natural fulvic concentration confirmed.</div>
    </div>
    <div className="lr-media">
    <img src="https://cdn.shopify.com/s/files/1/0720/3409/1309/files/Untitled_design_41.jpg" alt="AGROLAB fulvic and humic acid report" />
    <div className="lr-hint">Click on the report to explore more.</div>
    </div>
    </article>
    </section>
    <section className="lr-end">
    <h2>What This Means</h2>
    <p>Healing Shilajit™ has been independently tested across multiple internationally accredited laboratories including USA and Germany.</p>
    <p>Testing covers heavy metals, pesticides, mycotoxins, PAHs, GMO screening, microbiology, fulvic acid concentration, and stability.</p>
    <p>This ensures product safety, purity, mineral integrity, and long-term stability.</p>
    <div className="lr-tag">End of Report</div>
    </section>
    <footer className="tm-footer">
    <div className="tm-footer-grid">
    <div><h5>Information</h5>+92 333 807 1123<br />Support@healingshilajit.com</div>
    <div><h5>Site Address</h5>House 67, Abubaker Street, Usmanabad, Abbottabad, 22010, Pakistan</div>
    <div><h5>Office Address</h5>Himalayan Healing Pty, unit 8/49-51 Isabella Street, North Parramatta, NSW 2151, Australia</div>
    </div>
    <p className="tm-legal"><b>FDA Disclaimer:</b> These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.<br />© 2025 Healing Shilajit™ Trademarks &amp; Brands are the Property of their Respective Brand</p>
    </footer>
    </div>
  );
}
