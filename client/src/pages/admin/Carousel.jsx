import React, { useEffect, useState } from 'react';
import { carouselService, getImageUrl } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Image, Link2, AlertCircle } from 'lucide-react';

export default function Carousel() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [filePreview, setFilePreview] = useState('');

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await carouselService.getImages();
      if (res.success) {
        setImages(res.images);
      }
    } catch (err) {
      toast.error('Erreur lors du chargement des images.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Veuillez sélectionner une image.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', title);
    formData.append('link', link);

    try {
      const res = await carouselService.addImage(formData);
      if (res.success) {
        toast.success('Image ajoutée avec succès au carrousel !');
        // Clear form
        setFile(null);
        setTitle('');
        setLink('');
        setFilePreview('');
        fetchImages();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'ajout de l\'image.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette image du carrousel ?')) {
      try {
        const res = await carouselService.deleteImage(id);
        if (res.success) {
          toast.success('Image supprimée avec succès.');
          fetchImages();
        }
      } catch (err) {
        toast.error('Erreur lors de la suppression.');
      }
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Upload Image form */}
        <div className="lg:col-span-4 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-50 pb-4">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center">
              <Plus size={16} className="mr-2 text-brand-primary" />
              Ajouter une Image
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Ajoutez un visuel qui apparaîtra dans le défilement de l'accueil.</p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* File Selector */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Image du Carrousel *</label>
              
              {!filePreview ? (
                <div className="border-2 border-dashed border-slate-200 hover:border-brand-primary/50 transition-colors rounded-[16px] h-40 flex flex-col items-center justify-center relative bg-slate-50/50 cursor-pointer overflow-hidden group">
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <Image size={24} className="text-slate-400 group-hover:text-brand-primary transition-colors" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider mt-2 group-hover:text-slate-800 transition-colors">Choisir un fichier</span>
                  <span className="text-[9px] text-slate-400 font-semibold mt-0.5">JPEG, PNG ou WEBP (Max 5Mo)</span>
                </div>
              ) : (
                <div className="relative rounded-[16px] overflow-hidden border border-slate-200 h-40 bg-slate-100 flex items-center justify-center">
                  <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setFilePreview('');
                    }}
                    className="absolute top-2 right-2 bg-slate-900/60 hover:bg-slate-900 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Title (Optional) */}
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Titre (Optionnel)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Écrans Originaux Samsung"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none focus:border-brand-primary"
              />
            </div>

            {/* Target Link (Optional) */}
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lien de redirection (Optionnel)</label>
              <div className="relative">
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="Ex: /shop?category=ID_CATEGORIE"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[12px] pl-9 pr-4 py-3 focus:outline-none focus:border-brand-primary"
                />
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full gold-bg-gradient text-slate-950 font-black text-xs uppercase tracking-wider py-4 rounded-[16px] transition-transform hover:scale-102 active:scale-98 flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 mt-2 cursor-pointer"
            >
              <span>{uploading ? 'Téléchargement...' : 'Téléverser l\'Image'}</span>
            </button>
          </form>
        </div>

        {/* Right Side: Active Carousel images list */}
        <div className="lg:col-span-8 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-50 pb-4">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
              Images Actives du Carrousel
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Ces visuels s'affichent en boucle sur la page d'accueil de la boutique.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
            </div>
          ) : images.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-[20px] p-12 text-center flex flex-col items-center justify-center space-y-3">
              <AlertCircle size={32} className="text-slate-300" />
              <h4 className="font-bold text-slate-800 text-sm">Carrousel vide</h4>
              <p className="text-[10px] text-slate-400 max-w-xs leading-normal">Aucune image n'a encore été ajoutée. La boutique affiche actuellement une image par défaut.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {images.map((item) => (
                <div key={item._id} className="border border-slate-100 rounded-[20px] overflow-hidden bg-white shadow-sm flex flex-col hover:shadow-md transition-shadow group relative">
                  {/* Image wrapper */}
                  <div className="aspect-[16/9] w-full bg-slate-50 relative overflow-hidden">
                    <img src={getImageUrl(item.image)} alt={item.title || 'Slide'} className="w-full h-full object-cover" />
                    
                    {/* Delete button (floated) */}
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="absolute top-3 right-3 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white p-2 rounded-full shadow transition-all cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Metadata details */}
                  <div className="p-4 flex-grow flex flex-col justify-between text-left space-y-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">
                        {item.title || 'Sans titre'}
                      </h4>
                      {item.link ? (
                        <p className="text-[9px] text-slate-400 font-semibold flex items-center mt-1 truncate">
                          <Link2 size={10} className="mr-1" />
                          {item.link}
                        </p>
                      ) : (
                        <p className="text-[9px] text-slate-350 font-semibold mt-1">Aucun lien défini</p>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-400 font-semibold border-t border-slate-50 pt-2 flex items-center justify-between">
                      <span>Créé le :</span>
                      <span className="font-bold text-slate-600">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
