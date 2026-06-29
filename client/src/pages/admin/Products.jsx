import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { productService, categoryService, brandService, getImageUrl } from '../../services/api';

function StockAvailabilityToggle({ product, onUpdate }) {
  const [available, setAvailable] = useState(product.stock > 0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setAvailable(product.stock > 0);
  }, [product.stock]);

  const handleToggle = async () => {
    const nextState = !available;
    const newStock = nextState ? 9999 : 0;
    setUpdating(true);
    try {
      const res = await productService.updateProduct(product._id, { stock: newStock });
      if (res.success) {
        setAvailable(nextState);
        onUpdate(product._id, newStock);
        toast.success(
          nextState 
            ? `${product.name} est disponible` 
            : `${product.name} est en rupture de stock`,
          { id: `stock-${product._id}` }
        );
      }
    } catch (err) {
      toast.error('Échec de la mise à jour de la disponibilité du produit');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <button
      type="button"
      disabled={updating}
      onClick={handleToggle}
      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
        available
          ? 'bg-green-50 text-green-600 hover:bg-green-100'
          : 'bg-red-50 text-red-600 hover:bg-red-100'
      }`}
    >
      {updating ? 'Mise à jour...' : available ? 'Disponible' : 'Rupture'}
    </button>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal open states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [demiGrosPrice, setDemiGrosPrice] = useState('');
  const [superGrosPrice, setSuperGrosPrice] = useState('');
  const [priceDetailReparation, setPriceDetailReparation] = useState('');
  const [priceReparation, setPriceReparation] = useState('');
  const [importing, setImporting] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  
  // Custom specifications & variants list
  const [specifications, setSpecifications] = useState([{ key: '', value: '' }]);
  const [variants, setVariants] = useState([{ name: '', options: '' }]); // e.g. name: Color, options: Black,White

  // File Upload files state
  const [imageFiles, setImageFiles] = useState([]);
  const [imageUrls, setImageUrls] = useState([]); // for viewing edits

  // Category Quick Add modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newCategoryImageFile, setNewCategoryImageFile] = useState(null);
  const [savingCategory, setSavingCategory] = useState(false);

  // Brand Quick Add modal state
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandDesc, setNewBrandDesc] = useState('');
  const [newBrandLogoFile, setNewBrandLogoFile] = useState(null);
  const [savingBrand, setSavingBrand] = useState(false);

  useEffect(() => {
    fetchProductsList();
  }, [keyword, page]);

  useEffect(() => {
    fetchFiltersData();
  }, []);

  const fetchProductsList = async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts({ keyword, page, limit: 25 });
      if (res.success) {
        setProducts(res.products);
        setTotalPages(res.pages || 1);
      }
    } catch (err) {
      toast.error('Échec du chargement de l\'inventaire');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiltersData = async () => {
    try {
      const catRes = await categoryService.getCategories();
      const brandRes = await brandService.getBrands();
      if (catRes.success) setCategories(catRes.categories);
      if (brandRes.success) setBrands(brandRes.brands);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setPrice(product.priceDetail || product.price || '');
    setDiscountPrice(product.pricePromo || product.discountPrice || '');
    setDemiGrosPrice(product.priceDemiGros || product.demiGrosPrice || '');
    setSuperGrosPrice(product.priceSuperGros || product.superGrosPrice || '');
    setPriceDetailReparation(product.priceDetailReparation || '');
    setPriceReparation(product.priceReparation || '');
    setIsAvailable(product.stock > 0);
    setDescription(product.description);
    setSelectedCategory(product.category?._id || '');
    setSelectedBrand(product.brand?._id || '');
    setIsFeatured(product.isFeatured || false);
    
    // Build specs & variants from db
    setSpecifications(product.specifications?.length > 0 ? product.specifications : [{ key: '', value: '' }]);
    setVariants(
      product.variants?.length > 0
        ? product.variants.map((v) => ({ name: v.name, options: v.options.join(',') }))
        : [{ name: '', options: '' }]
    );
    
    setImageUrls(product.images || []);
    setImageFiles([]);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setPrice('');
    setDiscountPrice('');
    setDemiGrosPrice('');
    setSuperGrosPrice('');
    setPriceDetailReparation('');
    setPriceReparation('');
    setIsAvailable(true);
    setDescription('');
    setSelectedCategory('');
    setSelectedBrand('');
    setIsFeatured(false);
    setSpecifications([{ key: '', value: '' }]);
    setVariants([{ name: '', options: '' }]);
    setImageUrls([]);
    setImageFiles([]);
    setIsModalOpen(true);
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const toastId = toast.loading('Importation des produits en cours...');
    try {
      const res = await productService.importProducts(file);
      if (res.success) {
        toast.success(res.message || 'Importation réussie !', { id: toastId });
        fetchProductsList(); // Refresh products list
      } else {
        toast.error('Erreur lors de l\'importation', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'importation', { id: toastId });
    } finally {
      setImporting(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleExportExcel = async () => {
    const toastId = toast.loading('Génération du fichier d\'export...');
    try {
      const blob = await productService.exportProducts();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'produits_export.xls');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Fichier exporté avec succès !', { id: toastId });
    } catch (err) {
      toast.error('Erreur lors de l\'exportation', { id: toastId });
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce composant de l\'inventaire ?')) return;
    try {
      const res = await productService.deleteProduct(id);
      if (res.success) {
        toast.success('Composant retiré de l\'inventaire');
        fetchProductsList();
      }
    } catch (error) {
      toast.error('Échec de la suppression du produit');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement les ${selectedProductIds.length} produits sélectionnés ?`)) return;
    
    const toastId = toast.loading('Suppression de la sélection en cours...');
    try {
      const res = await productService.bulkDeleteProducts(selectedProductIds);
      if (res.success) {
        toast.success(`${selectedProductIds.length} produits supprimés avec succès`, { id: toastId });
        setSelectedProductIds([]);
        fetchProductsList();
      }
    } catch (err) {
      toast.error('Échec de la suppression groupée', { id: toastId });
    }
  };

  const handleSelectProduct = (productId) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
    } else {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
  };

  const handleSelectAllProducts = () => {
    const allIdsOnPage = products.map(p => p._id);
    const areAllSelected = allIdsOnPage.length > 0 && allIdsOnPage.every(id => selectedProductIds.includes(id));
    
    if (areAllSelected) {
      setSelectedProductIds(selectedProductIds.filter(id => !allIdsOnPage.includes(id)));
    } else {
      const newSelection = [...selectedProductIds];
      allIdsOnPage.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      setSelectedProductIds(newSelection);
    }
  };

  // Specs helpers
  const handleSpecChange = (index, field, val) => {
    const list = [...specifications];
    list[index][field] = val;
    setSpecifications(list);
  };

  const addSpecField = () => setSpecifications([...specifications, { key: '', value: '' }]);
  const removeSpecField = (idx) => setSpecifications(specifications.filter((_, i) => i !== idx));

  // Variants helpers
  const handleVariantChange = (index, field, val) => {
    const list = [...variants];
    list[index][field] = val;
    setVariants(list);
  };

  const addVariantField = () => setVariants([...variants, { name: '', options: '' }]);
  const removeVariantField = (idx) => setVariants(variants.filter((_, i) => i !== idx));

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCategoryName) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }
    
    setSavingCategory(true);
    const formData = new FormData();
    formData.append('name', newCategoryName);
    formData.append('description', newCategoryDesc);
    if (newCategoryImageFile) {
      formData.append('image', newCategoryImageFile);
    }
    
    try {
      const res = await categoryService.createCategory(formData);
      if (res.success) {
        toast.success(`Catégorie "${newCategoryName}" créée avec succès !`);
        setIsCategoryModalOpen(false);
        setNewCategoryName('');
        setNewCategoryDesc('');
        setNewCategoryImageFile(null);
        const catRes = await categoryService.getCategories();
        if (catRes.success) {
          setCategories(catRes.categories);
          setSelectedCategory(res.category._id);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Échec de la création de la catégorie');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    if (!newBrandName) {
      toast.error('Le nom de la marque est requis');
      return;
    }
    
    setSavingBrand(true);
    const formData = new FormData();
    formData.append('name', newBrandName);
    formData.append('description', newBrandDesc);
    if (newBrandLogoFile) {
      formData.append('logo', newBrandLogoFile);
    }
    
    try {
      const res = await brandService.createBrand(formData);
      if (res.success) {
        toast.success(`Marque "${newBrandName}" créée avec succès !`);
        setIsBrandModalOpen(false);
        setNewBrandName('');
        setNewBrandDesc('');
        setNewBrandLogoFile(null);
        const brandRes = await brandService.getBrands();
        if (brandRes.success) {
          setBrands(brandRes.brands);
          setSelectedBrand(res.brand._id);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Échec de la création de la marque du fabricant');
    } finally {
      setSavingBrand(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${name}" ?`)) return;
    try {
      const res = await categoryService.deleteCategory(id);
      if (res.success) {
        toast.success(`Catégorie "${name}" supprimée !`);
        const catRes = await categoryService.getCategories();
        if (catRes.success) setCategories(catRes.categories);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Échec de la suppression');
    }
  };

  const handleDeleteBrand = async (id, name) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la marque "${name}" ?`)) return;
    try {
      const res = await brandService.deleteBrand(id);
      if (res.success) {
        toast.success(`Marque "${name}" supprimée !`);
        const brandRes = await brandService.getBrands();
        if (brandRes.success) setBrands(brandRes.brands);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Échec de la suppression');
    }
  };

  // Form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategory || !selectedBrand) {
      toast.error('Veuillez attribuer une catégorie et une marque de fabricant');
      return;
    }

    // Assemble form data for file uploads
    const formData = new FormData();
    formData.append('name', name);
    formData.append('sku', sku);
    formData.append('price', price);
    formData.append('discountPrice', discountPrice);
    formData.append('demiGrosPrice', demiGrosPrice);
    formData.append('superGrosPrice', superGrosPrice);
    formData.append('priceDetail', price);
    formData.append('priceDetailReparation', priceDetailReparation);
    formData.append('priceReparation', priceReparation);
    formData.append('priceDemiGros', demiGrosPrice);
    formData.append('priceSuperGros', superGrosPrice);
    formData.append('pricePromo', discountPrice);
    formData.append('stock', isAvailable ? 9999 : 0);
    formData.append('description', description);
    formData.append('category', selectedCategory);
    formData.append('brand', selectedBrand);
    formData.append('isFeatured', isFeatured);

    // Format specs & variants to send
    const cleanSpecs = specifications.filter((s) => s.key && s.value);
    formData.append('specifications', JSON.stringify(cleanSpecs));

    const cleanVariants = variants
      .filter((v) => v.name && v.options)
      .map((v) => ({ name: v.name, options: v.options.split(',').map((o) => o.trim()) }));
    formData.append('variants', JSON.stringify(cleanVariants));

    // Append new uploaded files
    if (imageFiles.length > 0) {
      for (let file of imageFiles) {
        formData.append('images', file);
      }
    }

    // Always send the list of remaining/existing images to preserve them
    if (editingProduct) {
      formData.append('existingImages', JSON.stringify(imageUrls));
    }

    try {
      let res;
      if (editingProduct) {
        res = await productService.updateProduct(editingProduct._id, formData);
        toast.success('Composant mis à jour avec succès !');
      } else {
        res = await productService.createProduct(formData);
        toast.success('Composant ajouté au catalogue !');
      }

      if (res.success) {
        setIsModalOpen(false);
        fetchProductsList();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Échec de l\'enregistrement des détails du produit');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-slate-800 tracking-wide uppercase">Contrôles de l'inventaire</h1>
          <p className="text-xs text-slate-500">Gérer les composants d'appareils, les niveaux de stock, les variantes et les prix.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="bg-white border border-gray-300 text-slate-700 font-black text-xs uppercase tracking-wider px-6 py-4 rounded-[16px] flex items-center space-x-2 hover:bg-gray-50 transition-colors cursor-pointer select-none">
            <Upload size={14} />
            <span>Importer Excel</span>
            <input
              type="file"
              accept=".xls,.xlsx"
              className="hidden"
              onChange={handleImportExcel}
              disabled={importing}
            />
          </label>
          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-white border border-gray-300 text-slate-700 font-black text-xs uppercase tracking-wider px-6 py-4 rounded-[16px] flex items-center space-x-2 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <span>Exporter Excel</span>
          </button>
          <button
            onClick={handleAddClick}
            className="bg-brand-primary text-white font-black text-xs uppercase tracking-wider px-6 py-4 rounded-[16px] flex items-center space-x-2 hover:bg-amber-500 transition-colors"
          >
            <Plus size={16} />
            <span>Ajouter un composant</span>
          </button>
        </div>
      </div>

      {/* Top Search bar */}
      <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Rechercher par SKU ou description..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] pl-10 pr-4 py-2.5 focus:outline-none"
          />
          <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
        </div>

        {selectedProductIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs uppercase tracking-wider px-4.5 py-2.5 rounded-[12px] flex items-center space-x-2 border border-red-200/60 hover:scale-102 active:scale-98 transition-all cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Supprimer la sélection ({selectedProductIds.length})</span>
          </button>
        )}
      </div>

      {/* Products list table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[24px] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-500 text-xs">
              <thead className="bg-gray-50 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && products.every(p => selectedProductIds.includes(p._id))}
                      onChange={handleSelectAllProducts}
                      className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer w-4 h-4"
                    />
                  </th>
                  <th className="py-4 px-6">SKU / Article</th>
                  <th className="py-4 px-6">Fabricant</th>
                  <th className="py-4 px-6">Disponibilité</th>
                  <th className="py-4 px-6">Prix</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${selectedProductIds.includes(p._id) ? 'bg-amber-500/5' : ''}`}>
                    <td className="py-4 px-6 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(p._id)}
                        onChange={() => handleSelectProduct(p._id)}
                        className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800">
                      <div className="flex items-center space-x-3">
                        <img src={getImageUrl(p.images?.[0])} alt="" className="w-10 h-10 object-contain bg-slate-50 p-1 rounded-lg border border-slate-200" />
                        <div className="flex flex-col">
                          <span>{p.name}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">{p.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold uppercase">{p.brand?.name || '-'}</td>
                    <td className="py-4 px-6">
                      <StockAvailabilityToggle
                        product={p}
                        onUpdate={(id, newStock) => {
                          setProducts(prev => prev.map(prod => prod._id === id ? { ...prod, stock: newStock } : prod));
                        }}
                      />
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">{(p.priceDetail || p.price || 0).toLocaleString()} DA</td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center space-x-2">
                        <button onClick={() => handleEditClick(p)} className="p-2 text-slate-400 hover:text-brand-primary rounded-lg hover:bg-slate-100">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDeleteProduct(p._id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-gray-50/50 p-4 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                Page <strong className="text-slate-800 font-bold">{page}</strong> sur <strong className="text-slate-800 font-bold">{totalPages}</strong>
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 font-bold text-slate-700 hover:bg-slate-50 active:scale-97 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  Précédent
                </button>
                {[...Array(totalPages)].map((_, idx) => {
                  const pageNum = idx + 1;
                  if (totalPages > 5 && Math.abs(page - pageNum) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return <span key={pageNum} className="text-slate-400 px-1 font-bold">...</span>;
                    }
                    return null;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                        page === pageNum
                          ? 'gold-bg-gradient text-slate-950 shadow-sm'
                          : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 font-bold text-slate-700 hover:bg-slate-50 active:scale-97 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CRUD MODAL SHEET */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl p-8 max-h-[85vh] overflow-y-auto relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 p-1 rounded-full bg-slate-150 hover:bg-slate-200">
              <X size={20} />
            </button>

            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide mb-6">
              {editingProduct ? 'Modifier le composant' : 'Ajouter un composant'}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Core fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nom de l'article</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex. Écran OLED iPhone 13"
                    className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SKU</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="IP13-SCR-OLED"
                    className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                  />
                </div>
              </div>

              {/* Price & Stock status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prix 1 Detail (DA)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="ex. 1500"
                    className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prix 2 Detail Réparation (DA)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={priceDetailReparation}
                    onChange={(e) => setPriceDetailReparation(e.target.value)}
                    placeholder="ex. 1800"
                    className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prix 3 Réparation (DA)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={priceReparation}
                    onChange={(e) => setPriceReparation(e.target.value)}
                    placeholder="ex. 2000"
                    className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                  />
                </div>
              </div>

              {/* B2B Tiers Prices & Stock */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prix 4 Demi Gros (DA)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={demiGrosPrice}
                    onChange={(e) => setDemiGrosPrice(e.target.value)}
                    placeholder="ex. 1300"
                    className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prix 4 Super Gros (DA)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={superGrosPrice}
                    onChange={(e) => setSuperGrosPrice(e.target.value)}
                    placeholder="ex. 1200"
                    className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prix Promo (DA)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="ex. 1400"
                    className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Statut du stock</label>
                  <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-[12px] px-4 py-3 mt-1 hover:border-slate-200 transition-colors select-none">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                      className="w-4.5 h-4.5 text-brand-primary bg-slate-100 border-slate-350 rounded focus:ring-brand-primary cursor-pointer"
                    />
                    <span className="text-xs">En Stock</span>
                  </label>
                </div>
              </div>

              {/* Category & Brand selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catégorie</label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[10px] text-green-600 font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
                    >
                      + Ajouter
                    </button>
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                  >
                    <option value="">Choisir une catégorie</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Marque du fabricant</label>
                    <button
                      type="button"
                      onClick={() => setIsBrandModalOpen(true)}
                      className="text-[10px] text-green-600 font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
                    >
                      + Ajouter
                    </button>
                  </div>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                  >
                    <option value="">Choisir un fabricant</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description courte</label>
                <textarea
                  required
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Résumer les caractéristiques du produit..."
                  className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                />
              </div>

              {/* Specifications Builder */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-1 border-b border-slate-50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Spécifications techniques</span>
                  <button type="button" onClick={addSpecField} className="text-[10px] text-brand-primary font-bold">Ajouter une spécification</button>
                </div>
                {specifications.map((s, idx) => (
                  <div key={idx} className="flex space-x-3 items-center">
                    <input
                      type="text"
                      placeholder="ex. Taille"
                      value={s.key}
                      onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-3 py-2.5"
                    />
                    <input
                      type="text"
                      placeholder="ex. 6,7 pouces"
                      value={s.value}
                      onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-3 py-2.5"
                    />
                    {specifications.length > 1 && (
                      <button type="button" onClick={() => removeSpecField(idx)} className="text-red-500 text-xs font-bold px-2">Supprimer</button>
                    )}
                  </div>
                ))}
              </div>

              {/* Variants Builder */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-1 border-b border-slate-50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Variantes d'option</span>
                  <button type="button" onClick={addVariantField} className="text-[10px] text-brand-primary font-bold">Ajouter une variante</button>
                </div>
                {variants.map((v, idx) => (
                  <div key={idx} className="flex space-x-3 items-center">
                    <input
                      type="text"
                      placeholder="ex. Couleur"
                      value={v.name}
                      onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                      className="flex-grow bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-3 py-2.5"
                    />
                    <input
                      type="text"
                      placeholder="ex. Noir,Blanc,Bleu (séparés par des virgules)"
                      value={v.options}
                      onChange={(e) => handleVariantChange(idx, 'options', e.target.value)}
                      className="flex-grow bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-3 py-2.5"
                    />
                    {variants.length > 1 && (
                      <button type="button" onClick={() => removeVariantField(idx)} className="text-red-500 text-xs font-bold px-2">Supprimer</button>
                    )}
                  </div>
                ))}
              </div>

              {/* Image files upload */}
              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Images du produit</label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="w-24 h-24 border-2 border-dashed border-slate-200 hover:border-brand-primary rounded-[16px] flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <Upload size={20} className="text-slate-400" />
                    <span className="text-[9px] text-slate-400 mt-1 font-bold uppercase">Téléverser</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setImageFiles(Array.from(e.target.files))}
                      className="hidden"
                    />
                  </label>

                  {imageFiles.map((file, idx) => (
                    <div key={idx} className="w-24 h-24 bg-slate-50 border border-slate-150 rounded-[16px] flex items-center justify-center p-2 text-center text-[9px] truncate font-bold text-slate-500 relative">
                      {file.name}
                    </div>
                  ))}

                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="w-24 h-24 bg-slate-50 border border-slate-150 rounded-[16px] overflow-hidden p-2 flex items-center justify-center relative group">
                      <img src={url} alt="" className="max-h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Featured switch */}
              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-brand-primary border-slate-200 rounded accent-brand-primary"
                />
                <label htmlFor="featuredCheck" className="text-xs font-bold text-slate-600 select-none">
                  Mettre en avant ce composant sur la page d'accueil
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full bg-brand-secondary text-brand-primary font-black text-xs uppercase tracking-wider py-4.5 rounded-[16px]"
              >
                Enregistrer les modifications
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl p-6 relative border border-slate-100">
            <button onClick={() => setIsCategoryModalOpen(false)} className="absolute right-5 top-5 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200">
              <X size={16} />
            </button>

            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">
              Gérer les Catégories
            </h3>

            {/* Existing Categories List */}
            <div className="mb-6 border-b border-slate-100 pb-4 max-h-48 overflow-y-auto pr-1 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Catégories Existantes</span>
              {categories.length === 0 ? (
                <span className="text-[10px] text-slate-400">Aucune catégorie</span>
              ) : (
                <div className="space-y-1.5">
                  {categories.map((cat) => (
                    <div key={cat._id} className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-xl text-xs text-slate-700">
                      <span className="font-semibold">{cat.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat._id, cat.name)}
                        className="text-slate-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nom de la catégorie</label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="ex. Écrans, Batteries, Connecteurs de charge"
                  className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  rows="2"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Description facultative..."
                  className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Image de la catégorie</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-green-600 rounded-[12px] py-4 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <Upload size={16} className="text-slate-400" />
                    <span className="text-[9px] text-slate-400 mt-1 font-bold uppercase">
                      {newCategoryImageFile ? newCategoryImageFile.name : 'Téléverser'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewCategoryImageFile(e.target.files[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingCategory}
                className="w-full bg-brand-primary hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider py-4 rounded-[16px] disabled:opacity-55 transition-opacity"
              >
                {savingCategory ? 'Création...' : 'Créer la catégorie'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD BRAND MODAL */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl p-6 relative border border-slate-100">
            <button onClick={() => setIsBrandModalOpen(false)} className="absolute right-5 top-5 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200">
              <X size={16} />
            </button>

            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">
              Gérer les Marques
            </h3>

            {/* Existing Brands List */}
            <div className="mb-6 border-b border-slate-100 pb-4 max-h-48 overflow-y-auto pr-1 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Marques Existantes</span>
              {brands.length === 0 ? (
                <span className="text-[10px] text-slate-400">Aucune marque</span>
              ) : (
                <div className="space-y-1.5">
                  {brands.map((b) => (
                    <div key={b._id} className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-xl text-xs text-slate-700">
                      <span className="font-semibold">{b.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteBrand(b._id, b.name)}
                        className="text-slate-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleBrandSubmit} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nom de la marque</label>
                <input
                  type="text"
                  required
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="ex. Apple, Samsung, Xiaomi"
                  className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  rows="2"
                  value={newBrandDesc}
                  onChange={(e) => setNewBrandDesc(e.target.value)}
                  placeholder="Présentation facultative de la marque..."
                  className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Logo de la marque</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-green-600 rounded-[12px] py-4 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <Upload size={16} className="text-slate-400" />
                    <span className="text-[9px] text-slate-400 mt-1 font-bold uppercase">
                      {newBrandLogoFile ? newBrandLogoFile.name : 'Téléverser'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewBrandLogoFile(e.target.files[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingBrand}
                className="w-full bg-brand-primary hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider py-4 rounded-[16px] disabled:opacity-55 transition-opacity"
              >
                {savingBrand ? 'Création...' : 'Créer le fabricant'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
