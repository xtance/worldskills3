const byId = document.getElementById.bind(document);
const byName = document.getElementsByName.bind(document);
const api = 'http://tickets.xn--80ahdri7a.site/api';
let _token = localStorage.getItem('token');

// Контейнеры
const loginBlock = byId('login-block');
const searchBlock = byId('search-block');
const concertsBlock = byId('concerts-block');
const errorBlock = byId('error-block');
const profileBlock = byId('profile-block');

// Покажет ошибку
function showError(str){
    byId('error-text').textContent = str || '';
    errorBlock.style.display = str ? 'block' : 'none';
    if (str) setTimeout(showError, 5000);
}

// Получает данные с сервера
async function getData(url, method, body, headers = {}){

    try {

        let response;
        // Для гет-запросов создаём строку с параметрами
        if (method === 'GET'){
            response = await fetch(`${api}/${url}?${body.toString()}`, { method, headers });
        }
        // Для пост-запросов отправляем объект
        else {
            response = await fetch(`${api}/${url}`, {  method, body, headers });
        }

        // Вернулась какая-то ошибка
        //if (response.status !== 200) return { error: response.statusText };

        const json = await response.json();
        return json || { error: response.statusText };
    }
    catch(e){
        console.log('Исключение', e);
        return ({ error: e.toString() });
    }
}

// Обнуляет блок ошибок и концертов
function clear(){
    showError();
    concertsBlock.innerHTML = '';
}

// Получает значения из формочки
function getParams(formID){
   
    const fdata = new FormData(byId(formID));
    const params = new URLSearchParams();

    for (const pair of fdata){
        params.append(pair[0], pair[1]);
        console.log('Параметр', pair[0], pair[1]);
    }

    return params;
}

async function search(){

    clear();
    const res = await getData(`concert`, 'GET', getParams('form-search'));
    console.log(typeof res, res);

    const err = getError(res);
    if (err) return showError(err);

    const concerts = res.data.concert || [];
    if (!concerts.length) return showError('Нет концертов по выбранным параметрам.');

    // Заголовок
    const heading = document.createElement('h3');
    heading.textContent = `Найдено ${concerts.length} концертов:`;
    concertsBlock.appendChild(heading);

    concerts.forEach(concert => {

        const container = document.createElement('div');
        container.setAttribute('class', 'concert-container');
        concertsBlock.appendChild(container);
        
        const title = document.createElement('h3');
        title.textContent = concert.name_concert;
        container.appendChild(title);

        const info = document.createElement('p');
        info.innerHTML = `
            Цена билета: ${concert.price} руб., дата: ${concert.date_concert}. <br>
            Начало в ${concert.time_start}, конец в ${concert.time_finish}. <br>
            Продолжительность: ${concert.duration}.
        `;
        container.appendChild(info);

    });
}

function getAllErrors(map){
    let final = '';
    map.forEach(one => {
        const obj = one.error;
        Object.entries(obj).forEach(([ key, value ]) => {
            final += `Проблема с ${key}: ${value}\n`;
        });
    });
    return final;
}

function getError(res){
    if (!res) return 'Не пришёл ответ с сервера';
    if (Array.isArray(res)) return getAllErrors(res.map(one => one.error));
    if (res.error) return getAllErrors([res.error]);
    return false;
}

async function login(){
    clear();
    const res = await getData(`login`, 'POST', getParams('form-login'));
    console.log(typeof res, res);

    const err = getError(res);
    if (err) return showError(err);

    setToken(res.data.token);
    setLoginState();
}

async function setToken(str){
    _token = str;
    localStorage.setItem('token', str);
    return str;
}

async function getUserDetails(){

    const res = await getData('user', 'GET', {}, { Authorization: `Bearer ${_token}` });
    const err = getError(res);
    if (err) return showError(err);

    byId('first-name').textContent = res.first_name;
    byId('last-name').textContent = res.last_name;
    byId('phone').textContent = res.phone;
    console.log(res);
}

function setLoginState(){
    if (_token) {
        loginBlock.style.display = 'none';
        concertsBlock.style.display = 'block';
        searchBlock.style.display = 'block';
        profileBlock.style.display = 'block';
        getUserDetails();
    }
    else {
        loginBlock.style.display = 'block';
        concertsBlock.style.display = 'none';
        searchBlock.style.display = 'none';
        profileBlock.style.display = 'none';
    }
}

function logout(){
    setToken(null);
    setLoginState();
}

// Установка текущей даты в поля поиска
(() => {

    const date1 = new Date();
    const date2 = new Date(date1.getFullYear(), date1.getMonth()+1, 1); // конец месяца или 1 число след. месяца

    byName('date1')[0].value = date1.toISOString().slice(0, 10);
    byName('date2')[0].value = date2.toISOString().slice(0, 10);

    setLoginState();

})();