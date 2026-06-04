document.addEventListener('DOMContentLoaded', () => {

    const hero = document.querySelector('.vf-hero');

    if (!hero) return;

    const slides = [...hero.querySelectorAll('.vf-hero__slide')];
    const pagination = hero.querySelector('.vf-hero__pagination');

    const nextButton = hero.querySelector('.vf-hero__arrow--next');
    const prevButton = hero.querySelector('.vf-hero__arrow--prev');

    let current = 0;
    let dots = [];

    function goTo(index){

        slides[current].classList.remove('is-active');
        dots[current].classList.remove('is-active');

        current = index;

        slides[current].classList.add('is-active');
        dots[current].classList.add('is-active');
    }

    function createPagination(){

        if (!pagination) return;

        slides.forEach((_, index) => {

            const dot = document.createElement('button');

            dot.classList.add('vf-hero__dot');

            if(index === 0){
                dot.classList.add('is-active');
            }

            dot.addEventListener('click', () => {
                goTo(index);
            });

            pagination.appendChild(dot);
        });

        dots = [...pagination.children];
    }

    function next(){

        const nextIndex =
            current === slides.length - 1
            ? 0
            : current + 1;

        goTo(nextIndex);
    }

    function prev(){

        const prevIndex =
            current === 0
            ? slides.length - 1
            : current - 1;

        goTo(prevIndex);
    }

    createPagination();

    nextButton?.addEventListener('click', next);
    prevButton?.addEventListener('click', prev);

    setInterval(next, 7000);

});