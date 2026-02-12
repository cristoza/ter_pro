module.exports = {
  dashboard(req, res) {
    res.render('admin/index');
  },

  therapists(req, res) {
    res.render('admin/therapists');
  },

  patients(req, res) {
    res.render('admin/patients');
  },

  appointments(req, res) {
    res.render('admin/appointments');
  },

  analytics(req, res) {
    res.render('admin/analytics');
  },
};
