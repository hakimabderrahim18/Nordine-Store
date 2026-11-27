import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, X, Upload, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, History, RotateCcw, Eye, Download, FileSpreadsheet, Package, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { productService, categoryService, brandService, getImageUrl } from '../../services/api';
import { useTranslation } from '../../context/LanguageContext';

function StockAvailabilityToggle({ product, onUpdate }) {
  const { language } = useTranslation();
  const isAr = language === 'ar';
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
            ? (isAr ? `${product.name} أصبح متوفراً` : `${product.name} est disponible`)
            : (isAr ? `${product.name} نفذ من المخزون` : `${product.name} est en rupture de stock`),
          { id: `stock-${product._id}` }
        );
      }
    } catch (err) {
      toast.error(isAr ? 'فشل تحديث حالة التوفر' : 'Échec de la mise à jour de la disponibilité du produit');
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
      {updating ? (isAr ? 'جاري التحديث...' : 'Mise à jour...') : available ? (isAr ? 'متوفر' : 'Disponible') : (isAr ? 'نفذ' : 'Rupture')}
    </button>
  );
}

export default function Products() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
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
  const [syncing, setSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncFilterTab, setSyncFilterTab] = useState('all');
  const [syncSearchQuery, setSyncSearchQuery] = useState('');
  const [syncDetailsPage, setSyncDetailsPage] = useState(1);
  const [loadingHistoryDetails, setLoadingHistoryDetails] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState(null);
  const [isSyncHistoryModalOpen, setIsSyncHistoryModalOpen] = useState(false);
  const [syncHistoryList, setSyncHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [rollingBackId, setRollingBackId] = useState(null);
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
    const toastId = toast.loading('Importation et mise à jour des produits en cours...');
    try {
      const res = await productService.importProducts(file);
      if (res.success) {
        toast.success(res.message || 'Importation réussie !', { id: toastId, duration: 5000 });
        fetchProductsList(); // Refresh products list
      } else {
        toast.error(res.message || 'Erreur lors de l\'importation', { id: toastId });
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Votre session administrateur a expiré. Veuillez vous reconnecter.', { id: toastId, duration: 6000 });
      } else {
        toast.error(err.response?.data?.message || err.message || 'Erreur lors de l\'importation', { id: toastId, duration: 6000 });
      }
    } finally {
      setImporting(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleSyncExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSyncing(true);
    const toastId = toast.loading('Synchronisation avec le logiciel de gestion en cours...');
    try {
      const res = await productService.syncProducts(file);
      if (res.success) {
        setSyncReport(res);
        setSyncFilterTab('all');
        setSyncSearchQuery('');
        setSyncDetailsPage(1);
        setIsSyncModalOpen(true);
        toast.success('Synchronisation terminée avec succès !', { id: toastId, duration: 5000 });
        fetchProductsList();
      } else {
        toast.error(res.message || 'Erreur lors de la synchronisation', { id: toastId });
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Votre session administrateur a expiré. Veuillez vous reconnecter.', { id: toastId, duration: 6000 });
      } else {
        toast.error(err.response?.data?.message || err.message || 'Erreur lors de la synchronisation', { id: toastId, duration: 6000 });
      }
    } finally {
      setSyncing(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleOpenSyncDetails = async (historyId) => {
    setLoadingHistoryDetails(true);
    setViewingHistoryId(historyId);
    try {
      const res = await productService.getSyncHistoryById(historyId);
      if (res.success && res.history) {
        setSyncReport(res.history);
        setSyncFilterTab('all');
        setSyncSearchQuery('');
        setSyncDetailsPage(1);
        setIsSyncModalOpen(true);
      } else {
        toast.error('Impossible de charger les détails de cette synchronisation');
      }
    } catch (err) {
      toast.error('Erreur lors du chargement des détails de la synchronisation');
    } finally {
      setLoadingHistoryDetails(false);
      setViewingHistoryId(null);
    }
  };

  const handleExportSyncReport = () => {
    if (!syncReport) return;
    const lines = [];
    lines.push(['Type', 'Nom du produit', 'SKU / Reference', 'Detail de modification', 'Ancien', 'Nouveau'].map(v => `"${v}"`).join(','));

    // Price changes
    (syncReport.priceChangedItems || []).forEach(item => {
      (item.diffs || []).forEach(d => {
        lines.push([
          'PRIX MODIFIE',
          item.name,
          item.sku || '',
          d.label,
          `${d.oldVal} DA`,
          `${d.newVal} DA`
        ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','));
      });
    });

    // Stock changes
    (syncReport.stockChangedItems || []).forEach(item => {
      lines.push([
        item.isRestored ? 'STOCK RESTAURE' : 'STOCK MODIFIE',
        item.name,
        item.sku || '',
        'Quantité',
        item.oldStock,
        item.newStock
      ].map(v => `"${(v !== undefined ? v : '').toString().replace(/"/g, '""')}"`).join(','));
    });

    // Out of stock
    (syncReport.outOfStockItems || syncReport.outOfStockSamples || []).forEach(item => {
      lines.push([
        'RUPTURE / ABSENT DU LOGICIEL',
        item.name,
        item.sku || '',
        'Mis en rupture de stock',
        `Stock: ${item.previousStock || 0}`,
        'Stock: 0 (Indisponible)'
      ].map(v => `"${(v !== undefined ? v : '').toString().replace(/"/g, '""')}"`).join(','));
    });

    // Created items
    (syncReport.createdItems || []).forEach(item => {
      lines.push([
        'NOUVEAU PRODUIT CREE',
        item.name,
        item.sku || '',
        `Famille: ${item.category || '-'}`,
        'Inexistant',
        `Prix: ${item.price || 0} DA | Stock: ${item.stock || 0}`
      ].map(v => `"${(v !== undefined ? v : '').toString().replace(/"/g, '""')}"`).join(','));
    });

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rapport_synchronisation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Rapport CSV téléchargé avec succès !');
  };

  const handleOpenSyncHistory = () => {
    setIsSyncHistoryModalOpen(true);
    fetchSyncHistory();
  };

  const fetchSyncHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await productService.getSyncHistory();
      if (res.success) {
        setSyncHistoryList(res.history || []);
      }
    } catch (err) {
      toast.error('Erreur lors du chargement de l\'historique des synchronisations');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRollback = async (historyItem) => {
    const dateFormatted = new Date(historyItem.createdAt).toLocaleString();
    const confirmMsg = isAr
      ? `هل أنت متأكد من رغبتك في التراجع عن المزامنة (${historyItem.filename}) المؤرخة في ${dateFormatted} واستعادة كافة الأسعار والمخزون السابق؟`
      : `Êtes-vous sûr de vouloir annuler la synchronisation "${historyItem.filename}" du ${dateFormatted} ? Tous les prix et stocks modifiés seront restaurés à leur valeur précédente.`;

    if (!window.confirm(confirmMsg)) return;

    setRollingBackId(historyItem._id);
    const toastId = toast.loading('Restauration des données précédentes en cours...');
    try {
      const res = await productService.rollbackSync(historyItem._id);
      if (res.success) {
        toast.success(res.message || 'Synchronisation annulée et données restaurées avec succès !', { id: toastId, duration: 6000 });
        fetchSyncHistory();
        fetchProductsList();
      } else {
        toast.error(res.message || 'Erreur lors de la restauration', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Erreur lors de la restauration', { id: toastId });
    } finally {
      setRollingBackId(null);
    }
  };

  const handleExportExcel = async () => {
    const toastId = toast.loading('Génération du fichier d\'export...');
    try {
      const blob = await productService.exportProducts();
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `produits_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
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

  // Detailed lists from syncReport
  const allOutOfStockItems = useMemo(() => {
    return syncReport?.outOfStockItems || syncReport?.outOfStockSamples || [];
  }, [syncReport]);

  const allPriceChangedItems = useMemo(() => {
    return syncReport?.priceChangedItems || [];
  }, [syncReport]);

  const allStockChangedItems = useMemo(() => {
    return syncReport?.stockChangedItems || [];
  }, [syncReport]);

  const allCreatedItems = useMemo(() => {
    return syncReport?.createdItems || [];
  }, [syncReport]);

  // Combined "All impacted" items
  const combinedImpactedItems = useMemo(() => {
    const list = [];
    allOutOfStockItems.forEach(item => {
      list.push({ ...item, syncItemType: 'outOfStock' });
    });
    allPriceChangedItems.forEach(item => {
      list.push({ ...item, syncItemType: 'priceChanged' });
    });
    allStockChangedItems.forEach(item => {
      list.push({ ...item, syncItemType: 'stockChanged' });
    });
    allCreatedItems.forEach(item => {
      list.push({ ...item, syncItemType: 'created' });
    });
    return list;
  }, [allOutOfStockItems, allPriceChangedItems, allStockChangedItems, allCreatedItems]);

  // Filtered by active tab and search query
  const currentTabItems = useMemo(() => {
    let source = [];
    if (syncFilterTab === 'all') source = combinedImpactedItems;
    else if (syncFilterTab === 'outOfStock') source = allOutOfStockItems.map(i => ({ ...i, syncItemType: 'outOfStock' }));
    else if (syncFilterTab === 'priceChanged') source = allPriceChangedItems.map(i => ({ ...i, syncItemType: 'priceChanged' }));
    else if (syncFilterTab === 'stockChanged') source = allStockChangedItems.map(i => ({ ...i, syncItemType: 'stockChanged' }));
    else if (syncFilterTab === 'created') source = allCreatedItems.map(i => ({ ...i, syncItemType: 'created' }));

    const q = syncSearchQuery.trim().toLowerCase();
    if (!q) return source;
    return source.filter(item => 
      item.name?.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q)
    );
  }, [syncFilterTab, combinedImpactedItems, allOutOfStockItems, allPriceChangedItems, allStockChangedItems, allCreatedItems, syncSearchQuery]);

  const SYNC_ITEMS_PER_PAGE = 30;
  const totalSyncPages = Math.ceil(currentTabItems.length / SYNC_ITEMS_PER_PAGE) || 1;
  const paginatedSyncItems = useMemo(() => {
    const start = (syncDetailsPage - 1) * SYNC_ITEMS_PER_PAGE;
    return currentTabItems.slice(start, start + SYNC_ITEMS_PER_PAGE);
  }, [currentTabItems, syncDetailsPage]);

  // Reset page when tab or search changes
  useEffect(() => {
    setSyncDetailsPage(1);
  }, [syncFilterTab, syncSearchQuery]);

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-slate-800 tracking-wide uppercase">
            {t('admin_page_inventory')}
          </h1>
          <p className="text-xs text-slate-500">
            {isAr ? 'إدارة المكونات، قطع الغيار، فئات المخزون، والأسعار بالجملة والتجزئة.' : 'Gérer les composants d\'appareils, les niveaux de stock, les variantes et les prix.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider px-6 py-4 rounded-[16px] flex items-center space-x-2 shadow-sm transition-all cursor-pointer select-none active:scale-95">
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
            <span>{isAr ? 'مزامنة مع البرنامج (Excel)' : 'Synchroniser (Excel)'}</span>
            <input
              type="file"
              accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="hidden"
              onChange={handleSyncExcel}
              disabled={syncing}
            />
          </label>
          <button
            type="button"
            onClick={handleOpenSyncHistory}
            className="bg-slate-800 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider px-5 py-4 rounded-[16px] flex items-center space-x-2 shadow-sm transition-all cursor-pointer active:scale-95"
            title={isAr ? 'عرض سجل المزامنة وإمكانية التراجع' : 'Historique des synchronisations et restauration'}
          >
            <History size={15} />
            <span>{isAr ? 'سجل المزامنة' : 'Historique'}</span>
          </button>
          <label className="bg-white border border-gray-300 text-slate-700 font-black text-xs uppercase tracking-wider px-6 py-4 rounded-[16px] flex items-center space-x-2 hover:bg-gray-50 transition-colors cursor-pointer select-none">
            <Upload size={14} />
            <span>{isAr ? 'استيراد Excel' : 'Importer Excel'}</span>
            <input
              type="file"
              accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
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
            <span>{isAr ? 'تصدير Excel' : 'Exporter Excel'}</span>
          </button>
          <button
            onClick={handleAddClick}
            className="bg-brand-primary text-slate-950 font-black text-xs uppercase tracking-wider px-6 py-4 rounded-[16px] flex items-center space-x-2 hover:bg-amber-500 transition-colors"
          >
            <Plus size={16} />
            <span>{t('admin_prod_add')}</span>
          </button>
        </div>
      </div>

      {/* Top Search bar */}
      <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-80">
          <input
            type="text"
            placeholder={t('admin_prod_search')}
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            className={`w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] py-2.5 focus:outline-none ${
              isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'
            }`}
          />
          <Search size={14} className={`absolute top-3.5 text-slate-400 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
        </div>

        {selectedProductIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs uppercase tracking-wider px-4.5 py-2.5 rounded-[12px] flex items-center space-x-2 border border-red-200/60 hover:scale-102 active:scale-98 transition-all cursor-pointer"
          >
            <Trash2 size={14} />
            <span>{isAr ? `حذف المحدد (${selectedProductIds.length})` : `Supprimer la sélection (${selectedProductIds.length})`}</span>
          </button>
        )}
      </div>

      {/* Products list table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[24px] shadow-sm overflow-hidden text-start">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-slate-500 text-xs">
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
                  <th className="py-4 px-6">{t('admin_prod_col_name')} / SKU</th>
                  <th className="py-4 px-6">{t('admin_prod_col_brand')}</th>
                  <th className="py-4 px-6">{t('admin_prod_col_stock')}</th>
                  <th className="py-4 px-6">{t('admin_prod_col_price')}</th>
                  <th className="py-4 px-6 text-center">{t('admin_prod_col_actions')}</th>
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

      {/* SYNCHRONIZATION REPORT MODAL */}
      {isSyncModalOpen && syncReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-[28px] shadow-2xl p-5 sm:p-7 max-h-[92vh] flex flex-col text-start relative">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                    {isAr ? 'تقرير مزامنة المنتجات والأسعار' : 'Rapport Détaillé de Synchronisation'}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>📄 {syncReport.filename || 'synchronisation.xlsx'}</span>
                    <span>•</span>
                    <span>
                      {new Date(syncReport.createdAt || Date.now()).toLocaleString(isAr ? 'ar-DZ' : 'fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleExportSyncReport}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer active:scale-95"
                  title={isAr ? 'تحميل التقرير كملف CSV' : 'Télécharger le rapport au format CSV'}
                >
                  <Download size={14} />
                  <span>{isAr ? 'تصدير CSV' : 'Exporter CSV'}</span>
                </button>
                <button
                  onClick={() => setIsSyncModalOpen(false)}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 py-4">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  {isAr ? 'سطور الملف' : 'Lignes Excel'}
                </p>
                <p className="text-xl font-black text-slate-800">
                  {syncReport.stats?.totalExcelRows || 0}
                </p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {isAr ? 'منتج في الملف' : 'articles dans le fichier'}
                </p>
              </div>

              <div 
                onClick={() => setSyncFilterTab('outOfStock')}
                className={`border rounded-2xl p-3 text-center cursor-pointer transition-all ${
                  syncFilterTab === 'outOfStock' 
                    ? 'bg-red-50 border-red-300 ring-2 ring-red-400/30' 
                    : 'bg-red-50/50 border-red-100 hover:bg-red-50'
                }`}
              >
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-0.5">
                  {isAr ? 'نفذ المخزون (محذوف)' : 'Rupture (Absents)'}
                </p>
                <p className="text-xl font-black text-red-700">
                  {allOutOfStockItems.length || syncReport.stats?.markedOutOfStockCount || 0}
                </p>
                <p className="text-[10px] text-red-600/80 font-medium mt-0.5">
                  {isAr ? 'غير متوفرة في الملف' : 'absents du logiciel'}
                </p>
              </div>

              <div 
                onClick={() => setSyncFilterTab('priceChanged')}
                className={`border rounded-2xl p-3 text-center cursor-pointer transition-all ${
                  syncFilterTab === 'priceChanged' 
                    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/30' 
                    : 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
                }`}
              >
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                  {isAr ? 'تغير في الأسعار' : 'Prix Modifiés'}
                </p>
                <p className="text-xl font-black text-blue-700">
                  {allPriceChangedItems.length || syncReport.stats?.priceUpdatedCount || 0}
                </p>
                <p className="text-[10px] text-blue-600/80 font-medium mt-0.5">
                  {isAr ? 'تم تعديل أسعارها' : 'tarifs mis à jour'}
                </p>
              </div>

              <div 
                onClick={() => setSyncFilterTab('stockChanged')}
                className={`border rounded-2xl p-3 text-center cursor-pointer transition-all ${
                  syncFilterTab === 'stockChanged' 
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/30' 
                    : 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50'
                }`}
              >
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">
                  {isAr ? 'تعديل المخزون' : 'Stock Modifié'}
                </p>
                <p className="text-xl font-black text-emerald-700">
                  {allStockChangedItems.length || syncReport.stats?.restoredStockCount || 0}
                </p>
                <p className="text-[10px] text-emerald-600/80 font-medium mt-0.5">
                  {isAr ? 'استعادة / تحديث' : 'restauré / mis à jour'}
                </p>
              </div>

              <div 
                onClick={() => setSyncFilterTab('created')}
                className={`border rounded-2xl p-3 text-center cursor-pointer transition-all ${
                  syncFilterTab === 'created' 
                    ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400/30' 
                    : 'bg-purple-50/50 border-purple-100 hover:bg-purple-50'
                }`}
              >
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-0.5">
                  {isAr ? 'منتجات جديدة' : 'Nouveaux Produits'}
                </p>
                <p className="text-xl font-black text-purple-700">
                  {allCreatedItems.length || syncReport.stats?.createdCount || 0}
                </p>
                <p className="text-[10px] text-purple-600/80 font-medium mt-0.5">
                  {isAr ? 'أُضيفت تلقائياً' : 'créés depuis le fichier'}
                </p>
              </div>
            </div>

            {/* Filter Tabs and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3">
              {/* Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSyncFilterTab('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    syncFilterTab === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Layers size={13} />
                  <span>{isAr ? 'الكل' : 'Tous'}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${syncFilterTab === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {combinedImpactedItems.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSyncFilterTab('outOfStock')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    syncFilterTab === 'outOfStock'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  <span>🔴 {isAr ? 'في الروپتير / محذوف' : 'Rupture / Absents'}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${syncFilterTab === 'outOfStock' ? 'bg-red-700 text-white' : 'bg-red-200 text-red-800'}`}>
                    {allOutOfStockItems.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSyncFilterTab('priceChanged')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    syncFilterTab === 'priceChanged'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <span>🟡 {isAr ? 'تغيرت أسعارها' : 'Prix Modifiés'}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${syncFilterTab === 'priceChanged' ? 'bg-blue-700 text-white' : 'bg-blue-200 text-blue-800'}`}>
                    {allPriceChangedItems.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSyncFilterTab('stockChanged')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    syncFilterTab === 'stockChanged'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <span>🟢 {isAr ? 'المخزون' : 'Stock'}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${syncFilterTab === 'stockChanged' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-800'}`}>
                    {allStockChangedItems.length}
                  </span>
                </button>

                {allCreatedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSyncFilterTab('created')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                      syncFilterTab === 'created'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    <span>🟣 {isAr ? 'جديد' : 'Nouveaux'}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${syncFilterTab === 'created' ? 'bg-purple-700 text-white' : 'bg-purple-200 text-purple-800'}`}>
                      {allCreatedItems.length}
                    </span>
                  </button>
                )}
              </div>

              {/* Search in results */}
              <div className="relative min-w-[240px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={syncSearchQuery}
                  onChange={(e) => setSyncSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث بالاسم أو SKU...' : 'Filtrer par nom ou SKU...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-primary"
                />
                {syncSearchQuery && (
                  <button
                    onClick={() => setSyncSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Products Table (Scrollable Container) */}
            <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl max-h-[50vh] min-h-[220px]">
              {paginatedSyncItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <Package size={36} className="text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">
                    {syncSearchQuery
                      ? (isAr ? 'لا توجد نتائج مطابقة لبحثك' : 'Aucun produit ne correspond à votre recherche')
                      : (isAr ? 'لا توجد عناصر في هذا القسم' : 'Aucun produit dans cette catégorie')}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {syncSearchQuery && (isAr ? 'جرب البحث بكلمة أخرى' : 'Essayez un autre mot-clé ou videz le filtre.')}
                  </p>
                </div>
              ) : (
                <table className="w-full text-start border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] sticky top-0 z-10 shadow-xs">
                    <tr>
                      <th className="py-2.5 px-3.5 text-start">{isAr ? 'المنتج والرمز' : 'Article & Référence'}</th>
                      <th className="py-2.5 px-3 text-start">{isAr ? 'النوع' : 'Opération'}</th>
                      <th className="py-2.5 px-3.5 text-start">{isAr ? 'التفاصيل والتغييرات' : 'Détails des modifications'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedSyncItems.map((item, idx) => {
                      const itemType = item.syncItemType;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3.5">
                            <div className="font-bold text-slate-800 text-xs">{item.name}</div>
                            {item.sku && (
                              <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                                SKU: {item.sku}
                              </div>
                            )}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {itemType === 'outOfStock' && (
                              <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                                🔴 {isAr ? 'نفذ المخزون' : 'Rupture (Absent)'}
                              </span>
                            )}
                            {itemType === 'priceChanged' && (
                              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                                🟡 {isAr ? 'تغير السعر' : 'Prix Modifié'}
                              </span>
                            )}
                            {itemType === 'stockChanged' && (
                              <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg text-[10px] ${
                                item.isRestored ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {item.isRestored ? '🟢' : '🔄'} {item.isRestored ? (isAr ? 'استعادة التوفر' : 'Restauré') : (isAr ? 'تعديل المخزون' : 'Stock Ajusté')}
                              </span>
                            )}
                            {itemType === 'created' && (
                              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                                🟣 {isAr ? 'منتج جديد' : 'Nouveau Produit'}
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3.5">
                            {itemType === 'outOfStock' && (
                              <div className="text-[11px] text-slate-600">
                                <span className="text-slate-400">
                                  {isAr ? 'المخزون السابق:' : 'Stock précédent :'} <strong className="text-slate-700">{item.previousStock || 0}</strong>
                                </span>
                                <span className="mx-2 text-slate-300">→</span>
                                <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                  {isAr ? '0 (غير متوفر)' : 'Stock : 0 (Indisponible)'}
                                </span>
                                {!item.wasInStock && (
                                  <span className="ml-2 text-[10px] text-slate-400 italic">
                                    ({isAr ? 'كان منعدماً أصلاً' : 'déjà à zéro'})
                                  </span>
                                )}
                              </div>
                            )}

                            {itemType === 'priceChanged' && (
                              <div className="flex flex-wrap gap-2 text-[11px]">
                                {(item.diffs || []).map((d, dIdx) => (
                                  <div key={dIdx} className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 flex items-center gap-1.5">
                                    <span className="font-bold text-slate-600 text-[10px]">{d.label}:</span>
                                    <span className="line-through text-slate-400">{d.oldVal} DA</span>
                                    <span className="text-slate-300 font-bold">→</span>
                                    <span className="font-black text-emerald-600">{d.newVal} DA</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {itemType === 'stockChanged' && (
                              <div className="text-[11px] text-slate-600 flex items-center gap-2">
                                <span className="text-slate-400">
                                  {isAr ? 'من:' : 'De :'} <strong className="text-slate-700">{item.oldStock}</strong>
                                </span>
                                <span className="text-slate-300">→</span>
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                  {isAr ? 'إلى:' : 'À :'} {item.newStock} {isAr ? 'قطعة' : 'unités'}
                                </span>
                              </div>
                            )}

                            {itemType === 'created' && (
                              <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2">
                                <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded text-[10px]">
                                  {item.category || 'PIECE'}
                                </span>
                                <span>
                                  {isAr ? 'السعر:' : 'Prix :'} <strong className="text-slate-800">{item.price || 0} DA</strong>
                                </span>
                                <span>•</span>
                                <span>
                                  {isAr ? 'المخزون:' : 'Stock :'} <strong className="text-slate-800">{item.stock || 0}</strong>
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {totalSyncPages > 1 && (
              <div className="flex items-center justify-between pt-3 text-xs text-slate-600">
                <span className="text-[11px] text-slate-500">
                  {isAr 
                    ? `عرض ${(syncDetailsPage - 1) * SYNC_ITEMS_PER_PAGE + 1} إلى ${Math.min(syncDetailsPage * SYNC_ITEMS_PER_PAGE, currentTabItems.length)} من أصل ${currentTabItems.length} منتج` 
                    : `Affichage de ${(syncDetailsPage - 1) * SYNC_ITEMS_PER_PAGE + 1} à ${Math.min(syncDetailsPage * SYNC_ITEMS_PER_PAGE, currentTabItems.length)} sur ${currentTabItems.length} produits`}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={syncDetailsPage <= 1}
                    onClick={() => setSyncDetailsPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="font-bold text-[11px] px-2">
                    {syncDetailsPage} / {totalSyncPages}
                  </span>
                  <button
                    disabled={syncDetailsPage >= totalSyncPages}
                    onClick={() => setSyncDetailsPage(p => Math.min(totalSyncPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-4 mt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsSyncModalOpen(false);
                  handleOpenSyncHistory();
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <History size={15} />
                <span>{isAr ? 'عرض سجل المزامنات' : 'Historique des synchros'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all cursor-pointer"
              >
                {isAr ? 'إغلاق ومتابعة' : 'Fermer et continuer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SYNCHRONIZATION HISTORY MODAL */}
      {isSyncHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[28px] shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto relative text-start">
            <button
              onClick={() => setIsSyncHistoryModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black">
                <History size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                  {isAr ? 'سجل عمليات المزامنة والتراجع' : 'Historique des synchronisations'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isAr 
                    ? 'عرض تفاصيل المزامنات السابقة وإمكانية استرجاع الأسعار والمخزون السابق في حال حدوث أي خطأ.' 
                    : 'Consultez les synchronisations passées et restaurez l\'état précédent de vos produits en cas d\'erreur.'}
                </p>
              </div>
            </div>

            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-500 font-bold">{isAr ? 'جاري تحميل السجل...' : 'Chargement de l\'historique...'}</p>
              </div>
            ) : syncHistoryList.length === 0 ? (
              <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <History size={36} className="mx-auto text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-700 mb-1">
                  {isAr ? 'لا يوجد أي سجل مزامنة' : 'Aucun historique de synchronisation'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isAr
                    ? 'عند قيامك بمزامنة المنتجات عبر ملف Excel، سيتم تسجيل نسخة احتياطية من التغييرات هنا تلقائياً لتتمكن من الرجوع إليها.'
                    : 'Lorsque vous synchronisez des produits via un fichier Excel, chaque opération est archivée ici pour vous permettre de revenir en arrière.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">{isAr ? 'التاريخ والملف' : 'Date & Fichier'}</th>
                          <th className="py-3 px-4">{isAr ? 'المنتجات المعدلة' : 'Modifications'}</th>
                          <th className="py-3 px-4 text-center">{isAr ? 'الحالة' : 'Statut'}</th>
                          <th className="py-3 px-4 text-center">{isAr ? 'الإجراء' : 'Action'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {syncHistoryList.map((item) => {
                          const isReverted = item.status === 'reverted';
                          const isCurrentRollingBack = rollingBackId === item._id;
                          return (
                            <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-800 text-xs">
                                  {new Date(item.createdAt).toLocaleString(isAr ? 'ar-DZ' : 'fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono truncate max-w-[220px]" title={item.filename}>
                                  📄 {item.filename}
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1.5 text-[10px]">
                                  <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md">
                                    {item.stats?.priceUpdatedCount || 0} {isAr ? 'أسعار' : 'prix modifiés'}
                                  </span>
                                  <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md">
                                    {item.stats?.restoredStockCount || 0} {isAr ? 'في المخزون' : 'en stock'}
                                  </span>
                                  {item.stats?.createdCount > 0 && (
                                    <span className="bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-md">
                                      +{item.stats?.createdCount} {isAr ? 'جديد' : 'créés'}
                                    </span>
                                  )}
                                  {item.stats?.markedOutOfStockCount > 0 && (
                                    <span className="bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-md">
                                      {item.stats?.markedOutOfStockCount} {isAr ? 'نفذ' : 'épuisés'}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4 text-center">
                                {isReverted ? (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                      <RotateCcw size={10} />
                                      {isAr ? 'تم التراجع' : 'Annulée'}
                                    </span>
                                    {item.revertedAt && (
                                      <span className="text-[9px] text-slate-400 mt-0.5">
                                        {new Date(item.revertedAt).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR')}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 size={10} />
                                    {isAr ? 'مطبقة ونشطة' : 'Active'}
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSyncDetails(item._id)}
                                    disabled={loadingHistoryDetails && viewingHistoryId === item._id}
                                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] px-3 py-2 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                                    title={isAr ? 'عرض تفاصيل كافة المنتجات في هذه المزامنة' : 'Voir les détails complets des produits'}
                                  >
                                    {loadingHistoryDetails && viewingHistoryId === item._id ? (
                                      <RotateCcw size={12} className="animate-spin text-slate-500" />
                                    ) : (
                                      <Eye size={12} className="text-slate-600" />
                                    )}
                                    <span>{isAr ? 'التفاصيل' : 'Détails'}</span>
                                  </button>
                                  {isReverted ? (
                                    <span className="text-[10px] text-slate-400 font-medium italic px-2 py-1 bg-slate-50 rounded-lg">
                                      {isAr ? 'مسترجعة' : 'Déjà restaurée'}
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleRollback(item)}
                                      disabled={isCurrentRollingBack}
                                      className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                      title={isAr ? 'إلغاء واسترجاع المخزون والأسعار السابقة' : 'Annuler cette synchronisation et restaurer les stocks/prix'}
                                    >
                                      <RotateCcw size={12} className={isCurrentRollingBack ? 'animate-spin' : ''} />
                                      <span>
                                        {isCurrentRollingBack
                                          ? (isAr ? 'جاري الاسترجاع...' : 'Restauration...')
                                          : (isAr ? 'تراجع واسترجاع' : 'Restaurer')}
                                      </span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic px-1">
                  💡 {isAr
                    ? 'ملاحظة: الضغط على "تراجع واسترجاع" يعيد المنتجات فوراً إلى الأسعار ومستوى المخزون الذي كانت عليه قبل رفع ذلك الملف.'
                    : 'Remarque : Cliquer sur "Restaurer" rétablit immédiatement les produits aux prix et stocks qu\'ils avaient avant l\'importation de ce fichier.'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end pt-5 mt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSyncHistoryModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Fermer'}
              </button>
            </div>
          </div>
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
