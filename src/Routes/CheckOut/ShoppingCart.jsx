import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FaMinus, FaPlus, FaEye } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import style from "../../styles/Cart.module.css";
import Header from "../../Component/MainComponents/Header";
import Banner from "../../Component/MainComponents/Banner";
import Footer from "../../Component/MainComponents/Footer";
import Button from "../../Component/Buttons/Button";
import Chip from "../../Component/Buttons/Chip";
import DialogBox from "../../Component/MainComponents/DialogBox";
import EmptyCartPage from "./EmptyCartPage";
import { setCart } from "../../../Store/Slice/UserCartSlice";
import { setCartCount } from "../../../Store/Slice/CountSlice";
import { getUserCart, UpdateUserCart } from "../../axiosConfig/AxiosConfig";
import { Toast } from "../../Utils/Toast";
import { BsTrash } from "react-icons/bs";
import { useNavigate } from "react-router-dom";

const CartItem = ({
  item,
  type,
  onDelete,
  onUpdateQuantity,
  onShowProduct,
}) => {
  const isProduct = type === "product";
  const imageUrl = isProduct
    ? item?.sku?.images?.[0] || item?.productDetails?.images?.[0]?.url
    : item?.tiffinMenuDetails?.image_url?.[0]?.url || "/defaultImage.png";
  const name = isProduct
    ? item?.productDetails?.name?.toUpperCase()
    : item?.day;
  const price = isProduct
    ? item?.productDetails?.sellingPrice
    : item?.tiffinMenuDetails?.totalAmount;

  return (
    <tr className={style.cartItem}>
      <td>
        <div className={style.removeCell}>
          <button
            onClick={() =>
              onDelete(
                isProduct ? item.product_id : item.tiffinMenuId,
                type,
                item.day
              )
            }
          >
            <BsTrash className={style.removeIcon} />
          </button>
          {isProduct && (
            <button onClick={() => onShowProduct(item._id)}>
              <FaEye />
            </button>
          )}
        </div>
      </td>
      <td>
        <div className={style.productCell}>
          <img src={imageUrl} alt={type} className={style.cartItemImage} />
          <span>{name}</span>
        </div>
      </td>
      <td>${price?.toFixed(2)}</td>
      <td>
        <div className={style.quantityControl}>
          <button
            onClick={() => onUpdateQuantity(item._id, -1, type, item.day)}
            disabled={item.quantity <= 1}
          >
            <FaMinus size={14} />
          </button>
          <span className={style.quantity}>{item.quantity}</span>
          <button onClick={() => onUpdateQuantity(item._id, 1, type, item.day)}>
            <FaPlus size={14} />
          </button>
        </div>
      </td>
      <td className={style.totalPrice}>
        ${(price * item.quantity).toFixed(2)}
      </td>
    </tr>
  );
};

const CartTotals = ({
  handleClick,
  subtotal,
  total,
  discount,
  discountPercentage,
}) => (
  <div className={style.cartTotals}>
    <h3>Cart Totals</h3>
    <p>
      Total: <span>${total.toFixed(2)}</span>
    </p>
    <p>
      Subtotal: <span>${subtotal.toFixed(2)}</span>
    </p>
    {discount > 0 && (
      <p>
        Discount:{" "}
        <span className="discount">
          -${discount.toFixed(2)} ({discountPercentage.toFixed(2)}%)
        </span>
      </p>
    )}
    <hr />
    {/* <p>
      Shipping: <span>Self Pickup</span>
    </p> */}
    <hr />
    {/* <p>
      Shipping to: <strong>Calgary, AB</strong>
    </p> */}
    <hr />
    <p className={style.total}>
      Total: <span className={style.price}>${subtotal.toFixed(2)}</span>
    </p>
    <div className={style.checkoutButton}>
      <Button onClick={handleClick} variant="primary" size="md">
        Proceed to Checkout
      </Button>
    </div>
  </div>
);

const ShoppingCart = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart);
  const [dialog, setDialog] = useState({ isOpen: false, product: null });
  const navigate = useNavigate();

  const subtotal = useMemo(() => {
    if (isAuthenticated) {
      return (
        (cart?.items?.items?.reduce(
          (acc, item) =>
            acc + (item?.productDetails?.sellingPrice || 0) * item.quantity,
          0
        ) || 0) +
        (cart?.items?.tiffins?.reduce(
          (acc, item) =>
            acc + (item.tiffinMenuDetails?.totalAmount || 0) * item.quantity,
          0
        ) || 0)
      );
    } else {
      return (
        (cart?.items?.items?.reduce(
          (acc, item) => acc + (item?.sellingPrice || 0) * item.quantity,
          0
        ) || 0) +
        (cart?.items?.tiffins?.reduce(
          (acc, item) =>
            acc + (item.tiffinMenuDetails?.totalAmount || 0) * item.quantity,
          0
        ) || 0)
      );
    }
  }, [cart, isAuthenticated]);

  const total = useMemo(() => {
    if (isAuthenticated) {
      return (
        (cart?.items?.items?.reduce(
          (acc, item) =>
            acc + (item?.productDetails?.sellingPrice || 0) * item.quantity,
          0
        ) || 0) +
        (cart?.items?.tiffins?.reduce(
          (acc, item) =>
            acc + (item.tiffinMenuDetails?.totalAmount || 0) * item.quantity,
          0
        ) || 0)
      );
    } else {
      return (
        (cart?.items?.items?.reduce(
          (acc, item) =>
            acc + (item?.productDetails?.price || 0) * item.quantity,
          0
        ) || 0) +
        (cart?.items?.tiffins?.reduce(
          (acc, item) =>
            acc + (item.tiffinMenuDetails?.totalAmount || 0) * item.quantity,
          0
        ) || 0)
      );
    }
  }, [cart, isAuthenticated]);

  const discount = useMemo(() => {
    if (isAuthenticated) {
      return (
        cart?.items?.items?.reduce(
          (acc, item) =>
            acc +
            (item.productDetails?.price - item.productDetails?.sellingPrice) *
              item.quantity,
          0
        ) || 0
      );
    } else {
      return (
        cart?.items?.items?.reduce(
          (acc, item) =>
            acc + (item?.price - item?.sellingPrice) * item.quantity,
          0
        ) || 0
      );
    }
  }, [cart]);

  const discountPercentage = useMemo(() => {
    if (total === 0) return 0;
    return (discount / total) * 100;
  }, [discount, total]);

  const fetchUserCart = async () => {
    try {
      if (user?.userid) {
        const data = {
          id: user.userid,
        };
        const res = await getUserCart(data);
        dispatch(setCart(res.data.data));
      }
    } catch (error) {
      console.error("Error fetching user cart:", error);
      Toast({ message: "Failed to load cart!", type: "error" });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserCart();
    }
  }, [isAuthenticated]);

  const handleShowProduct = (id) => {
    const product = cart?.items?.items?.find((item) => item._id === id);
    if (product) {
      setDialog({ isOpen: true, product });
    } else {
      Toast({ message: "Product not found!", type: "error" });
    }
  };

  const updateItemQuantity = async (id, delta, type, dayName = null) => {
    try {
      if (!isAuthenticated) {
        const localCart = JSON.parse(localStorage.getItem("cart")) || {
          Tiffin: [],
          items: [],
        };
        const updateQuantity = (array) =>
          array.map((product) => {
            if (product._id === id) {
              const newQuantity = product.quantity + delta;
              if (newQuantity < 1 || newQuantity > product.stock) {
                Toast({
                  message:
                    newQuantity < 1
                      ? "Quantity cannot be less than 1"
                      : "Stock limit reached",
                  type: "error",
                });
                return product;
              }
              return { ...product, quantity: newQuantity };
            }
            return product;
          });
        const updatedTiffin = updateQuantity(localCart.Tiffin);
        const updatedItems = updateQuantity(localCart.items);
        const updatedCart = {
          Tiffin: updatedTiffin,
          items: updatedItems,
        };
        localStorage.setItem("cart", JSON.stringify(updatedCart));
        dispatch(setCart(updatedCart));
        dispatch(setCartCount(updatedTiffin.length + updatedItems.length));
        Toast({ message: "Quantity updated!", type: "success" });
      } else {
        let currentItem;
        let newQuantity;
        let data;

        if (type === "product") {
          currentItem = cart?.items?.items?.find((item) => item._id === id);
          if (!currentItem) {
            Toast({ message: "Product not found!", type: "error" });
            return;
          }
          newQuantity = currentItem.quantity + delta;
          if (
            newQuantity < 1 ||
            newQuantity > currentItem.productDetails.stock
          ) {
            Toast({
              message:
                newQuantity < 1
                  ? "Quantity cannot be less than 1"
                  : "Stock limit reached",
              type: "error",
            });
            return;
          }
          data = {
            user_id: user?.userid,
            type: "product",
            product_id: currentItem.product_id,
            quantity: newQuantity,
          };
        } else if (type === "tiffin") {
          currentItem = cart?.items?.tiffins?.find((item) => item._id === id);
          if (!currentItem) {
            Toast({ message: "Tiffin not found!", type: "error" });
            return;
          }
          newQuantity = currentItem.quantity + delta;
          if (newQuantity < 1) {
            Toast({ message: "Quantity cannot be less than 1", type: "error" });
            return;
          }
          data = {
            user_id: user?.userid,
            type: "tiffin",
            tiffinMenuId: currentItem.tiffinMenuId,
            quantity: newQuantity,
            day: dayName,
          };
        } else {
          Toast({ message: "Invalid item type!", type: "error" });
          return;
        }

        const res = await UpdateUserCart(data);
        dispatch(setCart(res.data.data));
        dispatch(
          setCartCount(
            (res.data.data.items?.items?.length || 0) +
              (res.data.data.items?.tiffins?.length || 0)
          )
        );
        Toast({ message: "Quantity updated!", type: "success" });
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      Toast({ message: "Failed to update quantity!", type: "error" });
    }
  };

  const handleDelete = async (id, type, dayName = null) => {
    try {
      if (!isAuthenticated) {
        const localCart = JSON.parse(localStorage.getItem("cart")) || {
          Tiffin: [],
          items: [],
        };
        let updatedTiffin = localCart.Tiffin;
        let updatedItems = localCart.items;
        if (localCart.items.length > 0) {
          updatedItems = localCart.items.filter((item) => item._id !== id);
        } else if (localCart.Tiffin.length > 0) {
          updatedTiffin = localCart.Tiffin.filter((item) => item._id !== id);
        }
        const updatedCart = {
          Tiffin: updatedTiffin,
          items: updatedItems,
        };
        localStorage.setItem("cart", JSON.stringify(updatedCart));
        Toast({ message: "Removed from cart!", type: "success" });
        dispatch(setCart(updatedCart));
        dispatch(setCartCount(updatedTiffin.length + updatedItems.length));
        return;
      } else {
        const data = {
          user_id: user?.userid,
          type,
          quantity: 0,
          product_id: type === "product" ? id : undefined,
          tiffinMenuId: type === "tiffin" ? id : undefined,
          day: type === "tiffin" ? dayName : undefined,
        };
        const res = await UpdateUserCart(data);
        dispatch(setCart(res.data.data));
        dispatch(
          setCartCount(
            (res.data.data.items?.items?.length || 0) +
              (res.data.data.items?.tiffins?.length || 0)
          )
        );
        Toast({ message: "Removed from cart!", type: "success" });
      }
    } catch (error) {
      console.error("Error deleting item from cart:", error);
      Toast({ message: "Failed to remove item!", type: "error" });
    }
  };

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
      Toast({ message: "Please login to checkout!", type: "error" });
    } else {
      navigate("/checkout");
    }
  };

  if (
    (isAuthenticated &&
      !cart?.items?.items?.length &&
      !cart?.items?.tiffins?.length) ||
    (!isAuthenticated && (!cart?.items?.items || !cart.items.items.length))
  ) {
    return (
      <div>
        <Header />
        <Banner name="CART" />
        <EmptyCartPage />
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <Banner name="CART" />
      <div className={style.cartContainer}>
        <div className={style.cartItems}>
          <table className={style.cartTable}>
            <thead>
              <tr className={style.cartItem}>
                <th />
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total Price</th>
              </tr>
            </thead>
            <tbody>
              {isAuthenticated &&
                cart?.items?.items?.map((item) => (
                  <CartItem
                    key={item._id}
                    item={item}
                    type="product"
                    onDelete={handleDelete}
                    onUpdateQuantity={updateItemQuantity}
                    onShowProduct={handleShowProduct}
                  />
                ))}
              {cart?.items?.tiffins?.map((tiffin) => (
                <CartItem
                  key={tiffin._id}
                  item={tiffin}
                  type="tiffin"
                  onDelete={handleDelete}
                  onUpdateQuantity={updateItemQuantity}
                  onShowProduct={handleShowProduct}
                />
              ))}
              {!isAuthenticated &&
                cart?.items?.items?.map((item) => (
                  <tr className={style.cartItem}>
                    <td>
                      <div className={style.removeCell}>
                        <RxCross2
                          className={style.removeIcon}
                          onClick={() => handleDelete(item._id, "product")}
                        />
                        <FaEye onClick={() => handleShowProduct(item._id)} />
                      </div>
                    </td>
                    <td>
                      <div className={style.productCell}>
                        <img
                          src={item?.images?.[0]?.url || "/defaultImage.png"}
                          alt={item.name}
                          className={style.cartItemImage}
                        />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td>${item.sellingPrice?.toFixed(2)}</td>
                    <td>
                      <div className={style.quantityControl}>
                        <button
                          onClick={() =>
                            updateItemQuantity(item._id, -1, "product")
                          }
                          disabled={item.quantity <= 1}
                        >
                          <FaMinus size={14} />
                        </button>
                        <span className={style.quantity}>{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateItemQuantity(item._id, 1, "product")
                          }
                        >
                          <FaPlus size={14} />
                        </button>
                      </div>
                    </td>
                    <td className={style.totalPrice}>
                      ${(item.sellingPrice * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <CartTotals
          subtotal={subtotal}
          total={total}
          discount={discount}
          discountPercentage={discountPercentage}
          handleClick={handleClick}
        />
      </div>
      <Footer />

      <DialogBox
        isOpen={dialog.isOpen}
        title="Product Detail"
        onClose={() => setDialog({ isOpen: false, product: null })}
      >
        {dialog.product && (
          <div className={style.productDetail}>
            <div className={style.productImage}>
              <img
                src={
                  isAuthenticated
                    ? dialog.product?.productDetails?.images?.[0]?.url
                    : dialog.product?.images?.[0]?.url
                }
                alt="product"
              />
            </div>
            <div className={style.productInfo}>
              <h2>
                {isAuthenticated
                  ? dialog.product?.productDetails?.name
                  : dialog.product?.name}
              </h2>
              <div className={style.productPricing}>
                <span className="originalPrice">
                  $
                  {isAuthenticated
                    ? dialog.product?.productDetails?.price
                    : dialog.product?.price}
                </span>
                <span className="Price">
                  $
                  {isAuthenticated
                    ? dialog.product?.productDetails?.sellingPrice
                    : dialog.product?.sellingPrice}
                </span>
              </div>
              <p className={style.productDescription}>
                Category:{" "}
                {isAuthenticated
                  ? dialog.product?.productDetails?.category
                  : dialog.product?.category}
              </p>
              {dialog.product?.productDetails?.subCategory ||
                (dialog.product?.subCategory && (
                  <p className={style.productDescription}>
                    SubCategory:{" "}
                    {isAuthenticated
                      ? dialog.product?.productDetails?.subCategory
                      : dialog.product?.subCategory}
                  </p>
                ))}
              {dialog.product?.productDetails?.subSubCategory ||
                (dialog.product?.ProductCategory && (
                  <p className={style.productDescription}>
                    Product:{" "}
                    {isAuthenticated
                      ? dialog.product?.productDetails?.ProductCategory
                      : dialog.product?.ProductCategory}
                  </p>
                ))}
              {/* <div>
                <Chip />
              </div> */}
              <p className={style.productDescription}>
                {isAuthenticated
                  ? dialog.product?.productDetails?.shortDescription
                  : dialog.product?.shortDescription}
              </p>
            </div>
          </div>
        )}
      </DialogBox>
    </div>
  );
};

export default ShoppingCart;
