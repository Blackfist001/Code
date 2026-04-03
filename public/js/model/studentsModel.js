export default class StudentsModel {

    constructor() {
        this.students = [];
    }

    async searchStudents(filters = {}) {
        try {
            const response = await api.searchStudents(filters);
            if (response.success) {
                this.students = response.results || [];
                return {
                    success: true,
                    count: response.count || 0,
                    results: this.students
                };
            } else {
                console.warn('StudentsModel.searchStudents: non success response', response);
                return {
                    success: false,
                    message: response.message || 'Aucun résultat trouvé',
                    results: []
                };
            }
        } catch (error) {
            console.error('StudentsModel.searchStudents error:', error);
            return {
                success: false,
                message: 'Erreur lors de la recherche',
                results: []
            };
        }
    }
}