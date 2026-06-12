import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CreateIssue = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState({});
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    primary_category: '',
    subcategory: '',
    priority: 'medium',
    department_id: '',
    is_anonymous: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, deptRes] = await Promise.all([
          api.get('/categories'),
          api.get('/departments?campus_id=' + JSON.parse(localStorage.getItem('dsims_user'))?.campus_id?._id ||
                  JSON.parse(localStorage.getItem('dsims_user'))?.campus_id || '')
        ]);
        setCategories(catRes.data);
        setDepartments(deptRes.data);
      } catch (err) {
        console.error('Error loading form data:', err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'primary_category' ? { subcategory: '' } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/issues', form);
      toast.success('Issue submitted successfully');
      navigate('/student/issues');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit issue');
    } finally {
      setLoading(false);
    }
  };

  const subcategories = form.primary_category ? (categories[form.primary_category] || []) : [];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="card p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Submit New Issue</h1>
        <p className="text-sm text-slate-500 mb-6">Describe your issue clearly so it can be resolved faster</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="input"
              placeholder="Brief summary of the issue"
              required
              minLength={5}
              maxLength={150}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="input min-h-[120px] resize-y"
              placeholder="Provide detailed information about the issue..."
              required
              minLength={20}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select name="primary_category" value={form.primary_category} onChange={handleChange} className="input" required>
                <option value="">Select category</option>
                {Object.keys(categories).map(cat => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subcategory</label>
              <select name="subcategory" value={form.subcategory} onChange={handleChange} className="input" required disabled={!form.primary_category}>
                <option value="">Select subcategory</option>
                {subcategories.map(sub => (
                  <option key={sub} value={sub}>{sub.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="input" required>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <select name="department_id" value={form.department_id} onChange={handleChange} className="input" required>
                <option value="">Select department</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="is_anonymous" checked={form.is_anonymous} onChange={handleChange} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <div>
              <span className="text-sm font-medium text-slate-700">Submit anonymously</span>
              <p className="text-xs text-slate-500">Your identity will be hidden from the department admin</p>
            </div>
          </label>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Submitting...' : (<><Send className="w-4 h-4" /> Submit Issue</>)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateIssue;