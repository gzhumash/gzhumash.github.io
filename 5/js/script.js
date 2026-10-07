async function loadData() {
    const response = await fetch('js/boardingData.json');
    return await response.json();
}

function updatePage(data) {
    document.title = data.title;
    document.getElementById('styleName').textContent = data.header;

    document.getElementById('heroTitle').textContent = data.hero.headline;
    document.getElementById('heroDesc').textContent = data.hero.description;

    document.getElementById('sec1Title').textContent = data.sections.overview.title;
    document.getElementById('sec1Subtitle').textContent = data.sections.overview.subtitle;
    updateCards('#sec1Grid .card', data.sections.overview.cards);

    document.getElementById('sec2Title').textContent = data.sections.equipment.title;
    document.getElementById('sec2Subtitle').textContent = data.sections.equipment.subtitle;
    updateCards('#sec2Grid .card', data.sections.equipment.cards);
}

function updateCards(selector, cardData) {
    const cards = document.querySelectorAll(selector);
    cards.forEach((card, i) => {
        card.querySelector('h3').textContent = cardData[i].title;
        card.querySelector('p').textContent = cardData[i].description;
    });
}

function updateBgImage(data){
    document.getElementById('heroSection').style.setProperty('--hero-img', `url('${data.hero.image}')`);
}

document.getElementById('changeThemeBtn').addEventListener('click', async () => {
  const data = await loadData();
  updatePage(data);
  updateBgImage(data);
});
