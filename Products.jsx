import React, { useState, useEffect } from "react";
import { FaTrash, FaEdit } from "react-icons/fa";
import LoadingComponent from "../src/components/Loading";

const Products = () => {
  const initialFormData = {
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    rating: "",
    volume: "",
    discount_price: "",
    promotion: false,
    ruler: "",
    oils_type: "",
    fidbek: "",
    image: {
      main_images: [],
      all_images: [],
    },
    imagePreviews: [],
    pdf: null,
  };

  const [categories, setCategories] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // For modals & form logic
  const [imageFields, setImageFields] = useState([0]);
  const [mainImageIndex, setMainImageIndex] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  // =========================
  //      Fetch Categories
  // =========================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("https://bakend-wtc.onrender.com/api/v1/categories");
        if (!response.ok) throw new Error("Failed to fetch categories");

        const categoriesData = await response.json();
        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // =========================
  //      Fetch Products
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("https://bakend-wtc.onrender.com/api/v1/products");
        if (!response.ok) throw new Error("Failed to fetch products");

        const products = await response.json();
        setData(products);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // =============== Form Handlers ===============

  // Change handler for text/number inputs & file inputs
  const handleFormChange = (e, index = null) => {
    const { name, value, files, type } = e.target;

    // If the user is uploading a file
    if (type === "file") {
      // If PDF
      if (name === "pdf") {
        setFormData((prevFormData) => ({
          ...prevFormData,
          pdf: files[0],
        }));
      }
      // If images
      else if (name === "images") {
        const updatedImages = [...formData.image.all_images];
        updatedImages[index] = files[0];

        const updatedPreviews = [...formData.imagePreviews];
        updatedPreviews[index] = URL.createObjectURL(files[0]);

        setFormData((prevFormData) => ({
          ...prevFormData,
          image: {
            ...prevFormData.image,
            all_images: updatedImages,
          },
          imagePreviews: updatedPreviews,
        }));
      }
    }
    // Otherwise for normal text/number inputs
    else {
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: value,
      }));
    }
  };

  // Add a new image field
  const addImageField = () => {
    if (formData.image.all_images.length >= 6) {
      alert("Нельзя загрузить более 6 изображений.");
    } else {
      setImageFields((prevFields) => [...prevFields, prevFields.length]);
    }
  };

  // Handling which image is the main image
  const handleMainImageSelection = (e, index) => {
    const isChecked = e.target.checked;

    setFormData((prevFormData) => {
      let updatedMainImages;
      if (isChecked) {
        updatedMainImages = [prevFormData.image.all_images[index]];
      } else {
        updatedMainImages = [];
      }

      return {
        ...prevFormData,
        image: {
          ...prevFormData.image,
          main_images: updatedMainImages,
        },
      };
    });

    if (isChecked) {
      setMainImageIndex(index);
    } else if (mainImageIndex === index) {
      setMainImageIndex(null);
    }
  };

  // Close a modal by ID
  const closeModal = (modalId) => {
    document.getElementById(modalId).close();
    setSelectedImage(null);
    setIsEditMode(false);
    setEditProductId(null);
  };

  // Open the large image modal
  const openImageModal = (image) => {
    setSelectedImage(image);
    document.getElementById("image_modal").showModal();
  };

  // Open the product form modal (for creating or editing)
  const openProductModal = (product = null) => {
    if (product) {
      // Edit mode
      setIsEditMode(true);
      setEditProductId(product._id);

      setFormData({
        ...initialFormData,
        ...product,
        image: {
          all_images: Array.isArray(product.image.all_images)
            ? product.image.all_images
            : [product.image.all_images],
          main_images: Array.isArray(product.image.main_images)
            ? product.image.main_images
            : [product.image.main_images],
        },
        imagePreviews:
          product.image && product.image.all_images
            ? product.image.all_images.map(
                (img) => `https://bakend-wtc.onrender.com/${img}`
              )
            : [],
      });
    } else {
      // Create mode
      setFormData(initialFormData);
      setIsEditMode(false);
      setEditProductId(null);
    }
    document.getElementById("my_modal_3").showModal();
  };

  // Open the modal for uploading images
  const openImageUploadModal = () => {
    document.getElementById("image_upload_modal").showModal();
  };

  // Submit handler (create or update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();

    // Convert JS object -> FormData (especially for files)
    Object.keys(formData).forEach((key) => {
      // If we are handling images
      if (key === "image") {
        // Main images
        if (formData.image?.main_images?.length > 0) {
          formData.image.main_images.forEach((file) => {
            // 'main_images' is the field name expected by the backend
            formDataToSend.append("main_images", file);
          });
        }
        // All images
        if (formData.image?.all_images?.length > 0) {
          formData.image.all_images.forEach((file) => {
            formDataToSend.append("all_images", file);
          });
        }
      }
      // If PDF
      else if (key === "pdf" && formData.pdf) {
        // 'product_info_pdf' is the field name expected by the backend
        formDataToSend.append("product_info_pdf", formData.pdf);
      }
      // Skip imagePreviews in form
      else if (key !== "imagePreviews") {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      const url = isEditMode
        ? `https://bakend-wtc.onrender.com/api/v1/products/${editProductId}`
        : "https://bakend-wtc.onrender.com/api/v1/products/create";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, { method, body: formDataToSend });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error: ${errorText}`);
      }

      const result = await response.json();

      if (isEditMode) {
        // Update item in local state
        setData((prevData) =>
          prevData.map((prod) =>
            prod._id === editProductId ? result.product : prod
          )
        );
      } else {
        // Add newly created product to the list
        setData((prevData) => [...prevData, result.product]);
      }

      closeModal("my_modal_3");
      setFormData(initialFormData);
    } catch (error) {
      console.error("Error saving product:", error);
      alert(`Error saving product: ${error.message}`);
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот продукт?")) return;

    try {
      const response = await fetch(
        `https://bakend-wtc.onrender.com/api/v1/products/${id}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Failed to delete product");
      setData((prevData) => prevData.filter((product) => product._id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Не удалось удалить продукт. Проверьте консоль для деталей.");
    }
  };

  // =========================
  //           RENDER
  // =========================
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingComponent />
      </div>
    );
  }

  return (
    <div className="p-5 flex flex-col w-full gap-5">
      <button
        className="btn mb-5 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg"
        onClick={() => openProductModal()}
      >
        Добавить
      </button>

      {/* CREATE/EDIT PRODUCT MODAL */}
      <dialog id="my_modal_3" className="modal">
        <div className="modal-box text-white relative bg-gray-800 rounded-lg p-8">
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-100 transition"
            onClick={() => closeModal("my_modal_3")}
          >
            ✕
          </button>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Product Name */}
              <label className="block">
                <span className="text-gray-300">Имя продукта</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="input w-full mt-1 p-2 bg-gray-700 rounded-md text-white"
                  required
                />
              </label>

              {/* Category */}
              <label className="block">
                <span className="text-gray-300">Категория</span>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="input w-full mt-1 p-2 bg-gray-700 rounded-md text-white"
                >
                  <option value="">Выберите категорию</option>
                  {categories?.length > 0 &&
                    categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.category_name}
                      </option>
                    ))}
                </select>
              </label>

              {/* Price */}
              <label className="block">
                <span className="text-gray-300">Цена продукта</span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleFormChange}
                  className="input w-full mt-1 p-2 bg-gray-700 rounded-md text-white"
                  required
                  min="0"
                  step="0.01"
                />
              </label>

              {/* Stock */}
              <label className="block">
                <span className="text-gray-300">Запас</span>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleFormChange}
                  className="input w-full mt-1 p-2 bg-gray-700 rounded-md text-white"
                  required
                  min="0"
                />
              </label>

              {/* Discount Price */}
              <label className="block">
                <span className="text-gray-300">Цена со скидкой</span>
                <input
                  type="number"
                  name="discount_price"
                  value={formData.discount_price}
                  onChange={handleFormChange}
                  className="input w-full mt-1 p-2 bg-gray-700 rounded-md text-white"
                  min="0"
                  step="0.01"
                />
              </label>

              {/* Rating */}
              <label className="block">
                <span className="text-gray-300">Рейтинг</span>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleFormChange}
                  className="input w-full mt-1 p-2 bg-gray-700 rounded-md text-white"
                  required
                  min="0"
                  max="5"
                  step="0.1"
                />
              </label>

              {/* Volume */}
              <label className="block">
                <span className="text-gray-300">Объем</span>
                <input
                  type="text"
                  name="volume"
                  value={formData.volume}
                  onChange={handleFormChange}
                  className="input w-full mt-1 p-2 bg-gray-700 rounded-md text-white"
                  required
                />
              </label>

              {/* Ruler */}
              <label className="block">
                <span className="text-gray-300">Правитель</span>
                <input
                  type="text"
                  name="ruler"
                  value={formData.ruler}
                  onChange={handleFormChange}
                  className="input w-full mt-1 p-2 bg-gray-700 rounded-md text-white"
                  required
                />
              </label>

              {/* Description */}
              <label className="block col-span-3">
                <span className="text-gray-300">Описание</span>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="textarea w-full mt-1 p-2 bg-gray-700 rounded-md text-white"
                  required
                ></textarea>
              </label>

              {/* Oil Type */}
              <label className="block col-span-3">
                <span className="text-gray-300">Тип масла</span>
                <input
                  type="text"
                  name="oils_type"
                  value={formData.oils_type}
                  onChange={handleFormChange}
                  className="input w-full mt-1 p-2 bg-gray-700 rounded-md text-white"
                />
              </label>

              {/* PDF */}
              <label className="block col-span-3">
                <span className="text-gray-300">PDF файла продукта</span>
                <input
                  type="file"
                  name="pdf"
                  onChange={handleFormChange}
                  className="file-input w-full mt-1 p-2 bg-gray-700 rounded-md text-white"
                  accept=".pdf"
                  // If you do NOT want it required on Edit, remove 'required' here
                  required={!isEditMode}
                />
              </label>

              {/* Button to open Image Upload Modal */}
              <button
                type="button"
                className="btn bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg mt-4"
                onClick={openImageUploadModal}
              >
                Добавить изображения
              </button>

              {/* Submit Button (Create/Update) */}
              <button
                type="submit"
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg mt-4"
              >
                {isEditMode ? "Сохранить изменения" : "Добавить продукт"}
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* IMAGE UPLOAD MODAL */}
      <dialog id="image_upload_modal" className="modal">
        <div className="modal-box text-white relative bg-gray-800 rounded-lg p-8">
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-100 transition"
            onClick={() => closeModal("image_upload_modal")}
          >
            ✕
          </button>

          {imageFields.map((field, index) => (
            <div key={index} className="mb-4">
              <label className="block text-gray-300">
                Изображение {index + 1}
              </label>
              <input
                type="file"
                name="images"
                onChange={(e) => handleFormChange(e, index)}
                className="file-input w-full mt-1 p-2 bg-gray-700 rounded-md text-white"
                required={!isEditMode} // require at least 1 image in create mode
              />

              {formData.imagePreviews[index] && (
                <div className="flex items-center mt-2">
                  <img
                    src={formData.imagePreviews[index]}
                    alt={`preview ${index}`}
                    className="w-32 h-32 object-cover mr-4"
                  />

                  <label className="text-gray-300 flex items-center">
                    <input
                      type="checkbox"
                      checked={mainImageIndex === index}
                      onChange={(e) => handleMainImageSelection(e, index)}
                      className="mr-2"
                    />
                    Показать в главном окне
                  </label>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            className="btn bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg mt-4"
            onClick={addImageField}
          >
            Добавить ещё изображение
          </button>
        </div>
      </dialog>

      {/* TABLE OF PRODUCTS */}
      <div className="p-5 w-full flex justify-between items-center bg-base-200 rounded-3xl">
        <div className="overflow-x-auto w-full">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="text-gray-300">Имя</th>
                <th className="text-gray-300">Изображения</th>
                <th className="text-gray-300">PDF</th>
                <th className="text-gray-300">Описание</th>
                <th className="text-gray-300">Цена</th>
                <th className="text-gray-300">Действия</th>
              </tr>
            </thead>
            <tbody className="w-full break-normal break-words">
              {data?.length > 0 &&
                data.map((product) => (
                  <tr key={product._id} className="w-full text-white">
                    {/* Product Name */}
                    <td>{product.name}</td>

                    {/* Main or first all_image */}
                    <td>
                      {product.image?.main_images?.length > 0 ? (
                        <img
                          src={`https://bakend-wtc.onrender.com/${product.image.main_images[0]}`}
                          alt={product.name}
                          className="w-16 h-16 object-cover inline-block mr-2 cursor-pointer"
                          onClick={() =>
                            openImageModal(
                              `https://bakend-wtc.onrender.com/${product.image.main_images[0]}`
                            )
                          }
                        />
                      ) : product.image?.all_images?.length > 0 ? (
                        <img
                          src={`https://bakend-wtc.onrender.com/${product.image.all_images[0]}`}
                          alt={product.name}
                          className="w-16 h-16 object-cover inline-block mr-2 cursor-pointer"
                          onClick={() =>
                            openImageModal(
                              `https://bakend-wtc.onrender.com/${product.image.all_images[0]}`
                            )
                          }
                        />
                      ) : (
                        <span>No Image Available</span>
                      )}
                    </td>

                    {/* PDF link */}
                    <td>
                      {product.product_info_pdf ? (
                        <a
                          href={`https://bakend-wtc.onrender.com/${product.product_info_pdf}`}
                          download
                        >
                          Скачать PDF
                        </a>
                      ) : (
                        <span>No PDF Available</span>
                      )}
                    </td>

                    {/* Description */}
                    <td>
                      {product.description
                        ? product.description.length > 30
                          ? `${product.description.substring(0, 30)}...`
                          : product.description
                        : "No description available"}
                    </td>

                    {/* Price */}
                    <td>${product.price}</td>

                    {/* Actions */}
                    <td id={product._id} className="flex flex-col gap-2 lg:flex-row">
                      <button
                        className="btn bg-slate-800 hover:bg-yellow-600 transition duration-200 mr-2"
                        onClick={() => {
                          openProductModal(product);
                          setEditProductId(product._id);
                        }}
                      >
                        <FaEdit /> редактировать
                      </button>
                      <button
                        className="btn bg-red-500 hover:bg-red-600 transition duration-200"
                        onClick={() => handleDelete(product._id)}
                      >
                        <FaTrash /> удалить
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FOR ENLARGED IMAGE */}
      <dialog id="image_modal" className="modal">
        <div className="modal-box relative bg-gray-800 rounded-lg p-8 text-center">
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-100 transition"
            onClick={() => closeModal("image_modal")}
          >
            ✕
          </button>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Selected"
              className="w-full h-auto object-contain"
            />
          )}
        </div>
      </dialog>
    </div>
  );
};

export default Products;
