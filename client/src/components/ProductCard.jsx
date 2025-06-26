import React from 'react';
import { assets } from '../assets/assets';
import { useAppContext } from '../context/AppContext';

const ProductCard = ({ product }) => {
    const { currency, addToCart, removeFromCart, cartItems, navigate } = useAppContext();

    return product && (
        <div
            onClick={() => {
                navigate(`./products/${product.category.toLowerCase()}/${product._id}`);
                scrollTo(0, 0);
            }}
            className="border border-gray-500/20 rounded-md px-3 md:px-4 py-2 bg-white w-full sm:min-w-56 sm:max-w-56"
        >
            {/* Image */}
            <div className="group cursor-pointer flex items-center justify-center px-2">
                <img
                    className="group-hover:scale-105 transition w-24 sm:w-28 md:w-36 h-auto object-contain"
                    src={product.image[0]}
                    alt={product.name}
                />
            </div>

            {/* Info */}
            <div className="text-gray-500/60 text-sm mt-2">
                <p>{product.category}</p>
                <p className="text-gray-700 font-medium text-base md:text-lg truncate w-full">
                    {product.name}
                </p>

                {/* Ratings */}
                <div className="flex items-center gap-0.5 mt-1">
                    {Array(5).fill('').map((_, i) => (
                        <img
                            key={i}
                            className="md:w-3.5 w-3"
                            src={i < 4 ? assets.star_icon : assets.star_dull_icon}
                            alt=""
                        />
                    ))}
                    <p>(4)</p>
                </div>

                {/* Price & Cart Controls */}
                <div className="flex items-end justify-between mt-3">
                    <p className="md:text-xl text-base font-medium text-primary">
                        {currency}{product.offerPrice}
                        {" "}
                        <span className="text-gray-500/60 md:text-sm text-xs line-through">
                            {currency}{product.price}
                        </span>
                    </p>

                    <div onClick={(e) => e.stopPropagation()} className="text-primary">
                        {!cartItems[product._id] ? (
                            <button
                                className="flex items-center justify-center gap-1 bg-primary/10 border border-primary/40 w-[64px] md:w-[80px] h-[34px] rounded cursor-pointer"
                                onClick={() => addToCart(product._id)}
                            >
                                <img src={assets.cart_icon} alt="cart_icon" />
                                <span className="text-xs md:text-sm">Add</span>
                            </button>
                        ) : (
                            <div className="flex items-center justify-center gap-2 w-16 md:w-20 h-[34px] bg-primary/25 rounded select-none">
                                <button onClick={() => removeFromCart(product._id)} className="cursor-pointer text-md px-2 h-full">-</button>
                                <span className="w-5 text-center">{cartItems[product._id]}</span>
                                <button onClick={() => addToCart(product._id)} className="cursor-pointer text-md px-2 h-full">+</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
