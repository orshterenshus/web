const html = document.documentElement;
const userName = document.getElementById('userName');

window.onload = function() {
    //משתנה לטעינת פרטי המשתמש שהתחבר
    let user;
    try {
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
            throw new Error('No user logged in');
        }
        user = JSON.parse(storedUser);
    } catch (e) {
        console.error("Error parsing user data:", e);
        alert("Session invalid. Please log in again.");
        window.location.href = 'login.html';
        return;
    }

    //עדכון כותרת להצגת שם המשתמש שהתחבר
    if (user && user.username) {
        userName.innerHTML = "Welcome " + user.username;
    } else {
        userName.innerHTML = "Welcome User";
    }

    // Add navigation handlers
    document.getElementById('projectsBtn').onclick = function() {
        window.location.href = '../../project-management/index.html';
    };
    
    document.getElementById('logoutBtn').onclick = function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    };

    //שליחת בקשה לשליפת נתונים מהקובץ
    fetch('db.json')
     .then(response =>  response.json()) //שמירת אובייקט התשובה
     .then(jsonData => { //שמירת נתוני הקובץ
//שליחה לפונקציה לטעינה לטבלה
        	populateTable('usersData', jsonData);   
}); 
};

function populateTable(tableId, jsonData) {
    //משתנה לקישור לתגיות הטבלה
    const table = document.getElementById(tableId);
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');
    //אתחול של תוכן רכיבי הטבלה
    thead.innerHTML = '';
    tbody.innerHTML = '';
    //אם קיימים נתוני משתמשים בקובץ
    if (jsonData.users.length > 0) {
	  //ניקח את כל המפתחות מקובץ לתוך משתנה
        const headers = Object.keys(jsonData.users[0]);
	  //עבור כל מפתח
        headers.forEach(header => {
            if(header != "password"){ //אם הוא לא סיסמא
		    //ניצור למפתח תא כותרת
                const th = document.createElement('th'); 
                th.textContent = header;
                th.classList.add('px-4', 'py-2', 'text-left');
		     //נוסיף לשורת הכותרת של הטבלה
                thead.appendChild(th);
            }
        });
        //עבור כל אובייקט בתוך המערך
        jsonData.users.forEach(item => {
		//ניצור רשומה בטבלה
            const tr = document.createElement('tr');
		//לכל מפתח שאינו סיסמא
            headers.forEach(header => {
                if(header != "password"){
				
			   //ניצור תא עם תוכן 
                    const td = document.createElement('td');
                    td.textContent = item[header];
                    td.classList.add('border', 'px-4', 'py-2');
                    //נוסיף מאזין לתא כדי שנוכל לבצע עריכה
                    td.addEventListener("dblclick", ()=>editable.edit(td))
			   //נוסיף את התא לרשומה
                    tr.appendChild(td);
                }
            });
		//נוסיף לגוף הטבלה את הרשומה
            tbody.appendChild(tr);
        });
    } 
    //אם לא קיימים נתוני משתמשים בקובץ
    else {
        //יצירת שורה בטבלה
        const tr = document.createElement('tr');
        //יצירת עמודה בטבלה
        const td = document.createElement('td');
	  //הוספת תוכן לעמודה שאין מידע
        td.textContent = "No data found in JSON.";
	  //הוספת השורה עם התוכן לגוף הטבלה
        tbody.appendChild(tr);
    }
}
let editable = {
    ccell : null, //הפנייה לתא
    cval : null, //תוכן התא
    edit: cell=>{ //אם בוצעה לחיצה כפולה
        editable.ccell = cell; //שמירת התא שעליו נלחץ
        editable.cval = cell.innerHTML; //שמירת תוכן התא שעליו נלחץ
        cell.classList.add("edit"); //הוספת ויזואליזציה של עריכה
        cell.contentEditable = true; //שינוי מצב שהתא בעריכה
        cell.focus();
        cell.onblur = editable.done; //ברגע שנלחץ מחוץ לתא הגדרת סיום
        cell.onkeydown = e =>{ //במידה ונלחץ אנטר או אסקייפ הגדרת סיום
            if(e.key == "Enter"){ editable.done(); }
            if(e.key == "Escape"){ editable.done(1); }
        }
    },
    done: discard =>{ //אם בוצע סיום
	  //שחרור מאזינים
        editable.ccell.onblur = ""; 
        editable.ccell.onkeydown = "";
	  //הורדת ויזואליזציה של עריכה
        editable.ccell.classList.remove("edit");
    //שינוי מצב שהתא לא בעריכה
        editable.ccell.contentEditable = false;
        if(discard===1){ //if escape
            editable.ccell.innerHTML = editable.cval; //החזרת ערך קודם
        }
	  //אם הערך שונה יש לבצע עדכון קובץ
        if(editable.ccell.innerHTML != editable.cval){
            console.log("change");

            fetch('/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(jsonData)
            })
            .then(res => res.json())
            .then(result => console.log('File updated:', result))
            .catch(err => console.error('Error:', err));
        }
    }
}




// const currentUser = localStorage.getItem('currentUser');
// document.getElementById('welcome').textContent = `Welcome, ${currentUser}!`;
// let users = JSON.parse(localStorage.getItem('users')) || [];
// let user =  users.find(u=>u.username === currentUser);
// document.getElementById('info').innerHTML = `<strong>Email:</strong> ${user.email}<br>
//   <strong>Date of Birth:</strong> ${user.dob}`;