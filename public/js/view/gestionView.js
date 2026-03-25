export default class GestionView {

    constructor(controller) {
        this.controller = controller;
        this.container = document.getElementById('container');
    }

    render() {
        fetch('html/gestion.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this.attachEventListeners();
            })
            .catch(error => console.error('Error loading gestion:', error));
    }

    attachEventListeners() {
        // Add User Handler
        const addUserBtn = document.getElementById('btn-add-user');
        if (addUserBtn && this.controller) {
            addUserBtn.addEventListener('click', () => {
                const username = document.getElementById('user-username').value;
                const password = document.getElementById('user-password').value;
                const role = document.getElementById('user-role').value;
                
                if (username && password && role) {
                    const userData = {
                        username: username,
                        password: password,
                        role: role
                    };
                    this.controller.addUser(userData);
                    document.getElementById('user-username').value = '';
                    document.getElementById('user-password').value = '';
                    document.getElementById('user-role').value = '';
                }
            });
        }

        // Add Student Handler
        const addStudentBtn = document.getElementById('btn-add-student');
        if (addStudentBtn && this.controller) {
            addStudentBtn.addEventListener('click', () => {
                const nom = document.getElementById('student-nom').value;
                const prenom = document.getElementById('student-prenom').value;
                const classe = document.getElementById('student-classe').value;
                const email = document.getElementById('student-email').value;
                
                if (nom && prenom && classe) {
                    const studentData = {
                        nom: nom,
                        prenom: prenom,
                        classe: classe,
                        email: email
                    };
                    this.controller.addStudent(studentData);
                    document.getElementById('student-nom').value = '';
                    document.getElementById('student-prenom').value = '';
                    document.getElementById('student-classe').value = '';
                    document.getElementById('student-email').value = '';
                }
            });
        }
    }

    displayStudents(students = []) {
        const tbody = document.getElementById('students-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!students || students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Aucun étudiant</td></tr>';
            return;
        }
        
        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.id_etudiant || '---'}</td>
                <td>${student.nom || '---'}</td>
                <td>${student.prenom || '---'}</td>
                <td>${student.classe || '---'}</td>
                <td>${student.email || '---'}</td>
                <td>
                    <button class="btn-delete-student" data-student-id="${student.id_etudiant}">
                        Supprimer
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Attach delete handlers
        document.querySelectorAll('.btn-delete-student').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const studentId = e.target.getAttribute('data-student-id');
                if (this.controller && confirm('Êtes-vous sûr?')) {
                    this.controller.deleteStudent(studentId);
                }
            });
        });
    }

    displayUsers(users = []) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">Aucun utilisateur</td></tr>';
            return;
        }
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id || '---'}</td>
                <td>${user.username || '---'}</td>
                <td>${user.role || '---'}</td>
                <td>
                    <button class="btn-delete-user" data-user-id="${user.id}">
                        Supprimer
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
}