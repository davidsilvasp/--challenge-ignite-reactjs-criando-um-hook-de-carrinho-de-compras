import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const newCart = [...cart];
      const productInCart = newCart.find(({ id }) => id === productId);

      if (productInCart) {
        const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

        if (productInCart.amount + 1 > stock.amount) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }

        productInCart.amount++;

        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      } else {
        const { data: product } = await api.get(`/products/${productId}`);

        const newCart = [...cart, { ...product, amount: 1 }];
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      }
    } catch (err) {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];
      const index = newCart.findIndex(({ id }) => id === productId);

      if (index < 0) {
        toast.error("Erro na remoção do produto");
        return;
      }

      newCart.splice(index, 1);

      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch (err) {
      toast.error(err);
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount < 1) return;

    try {
      // TODO
      const newCart = [...cart];
      const productInCart = newCart.find(({ id }) => id === productId);

      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

      if (!productInCart) return;

      productInCart.amount = amount > stock.amount ? stock.amount : amount;

      if (amount > stock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      // TODO
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
