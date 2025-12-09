const getImageUrl = (path) => {
  return path && path !== "" ? `/api/image?file=${path}` : "no-image.png";
};

function ProductInformation({ product, storeName, onStoreClick }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Large Image */}
        <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
          <img
            src={getImageUrl(product.image)}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Toko</h3>
            <button
              onClick={onStoreClick}
              className="text-green-600 hover:text-green-700 font-medium text-lg hover:underline"
            >
              {storeName}
            </button>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Quantity</h3>
            <p className="text-lg">{product.quantity} unit</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Deskripsi Produk</h3>
            <div 
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductInformation;
