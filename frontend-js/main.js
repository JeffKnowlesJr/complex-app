import Search from './modules/search'
import Chat from './modules/chat'

if (document.querySelector('.header-search-icon')) {
  new Search()
}

if (document.querySelector('#chatWrapper')) {
  new Chat()
}
