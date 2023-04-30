import 'simplelightbox/dist/simple-lightbox.min.css';
import SimpleLightbox from 'simplelightbox';
import { Notify } from 'notiflix';
import refs from './js/refs';
import ImagesServiceAPI from './js/images-service';
import { renderCards } from './js/renderCards';
import LoadMoreBtn from './js/load-more-btn';
import smoothScroll from './js/smooth-scroll';

const lightbox = new SimpleLightbox('.gallery-link');
const imagesServiceAPI = new ImagesServiceAPI();
const loadMoreBtn = new LoadMoreBtn({
  selector: '.load-more',
  hidden: true,
});

refs.searchForm.addEventListener('submit', onSearch);
loadMoreBtn.refs.button.addEventListener('click', onLoadMore);

function onSearch(e) {
  e.preventDefault();
  loadMoreBtn.hide();
  refs.gallery.innerHTML = '';
  imagesServiceAPI.query = e.currentTarget.elements.searchQuery.value;

  if (imagesServiceAPI.query.trim() === '') {
    Notify.info('Please, fill out input field by your query!');
    return;
  }

  Notify.info('Loading attempt...');
  imagesServiceAPI.resetPage();
  observer.unobserve(refs.guard);

  try {
    searchImages();
  } catch (error) {
    console.log(error);
  }
}

async function searchImages() {
  const imagesData = await imagesServiceAPI.fetchImages();

  if (imagesData.hits.length === 0) {
    Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
    return;
  }
  observer.observe(refs.guard); // <= COMMENT THIS LINE TO TEST LOAD MORE BTN
  loadMoreBtn.enable();
  loadMoreBtn.show();
  Notify.success(`"Hooray! We found ${imagesData.totalHits} images."`);
  refs.gallery.insertAdjacentHTML('beforeend', renderCards(imagesData));
  lightbox.refresh();
}

// IF YOU WANT TO TEST LOAD MORE BTN - JUST COMMENT 51 LINE.

function onLoadMore() {
  imagesServiceAPI.incrementPage();

  try {
    loadMoreImages();
  } catch (error) {
    console.log(error);
  }
}

async function loadMoreImages() {
  loadMoreBtn.disable();
  const imagesData = await imagesServiceAPI.fetchImages();

  if (
    imagesData.totalHits <
    imagesServiceAPI.page * imagesServiceAPI.per_page
  ) {
    Notify.info(`We're sorry, but you've reached the end of search results.`);
    refs.gallery.insertAdjacentHTML('beforeend', renderCards(imagesData));
    lightbox.refresh();
    loadMoreBtn.hide();
    return;
  }

  loadMoreBtn.enable();
  refs.gallery.insertAdjacentHTML('beforeend', renderCards(imagesData));
  smoothScroll();
  lightbox.refresh();
}

const options = {
  rootMargin: '300px',
};
const observer = new IntersectionObserver(onLoad, options);

function onLoad(entries, observer) {
  entries.forEach(async entry => {
    if (entry.isIntersecting) {
      loadMoreBtn.hide();
      loadMoreBtn.disable();
      imagesServiceAPI.incrementPage();
      try {
        const imagesData = await imagesServiceAPI.fetchImages();

        if (
          imagesData.totalHits <
          imagesServiceAPI.page * imagesServiceAPI.per_page
        ) {
          Notify.info(
            `We're sorry, but you've reached the end of search results.`
          );
          refs.gallery.insertAdjacentHTML('beforeend', renderCards(imagesData));
          observer.unobserve(refs.guard);
          lightbox.refresh();

          return;
        }
        refs.gallery.insertAdjacentHTML('beforeend', renderCards(imagesData));

        smoothScroll();
        lightbox.refresh();
      } catch (error) {
        console.log(error);
      }
    }
  });
}
