import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });


  const addProduct = async (productId: number) => {
    console.time("Execution time1")
    try {
      const stock = await api.get(`/stock/${productId}`);
      let products = await api.get(`/products/${productId}`);

      let updatedProduct = cart.find(product=>product.id === productId)
    
      let updatedProductAmount = updatedProduct === undefined ? 1 : updatedProduct.amount+1

      let newCart = [
        ...cart,
        {
          ...products.data,
          amount: updatedProductAmount
        }
      ]

      if (stock.data.amount >= updatedProductAmount){
        updatedProductAmount > 1 ? 
        updateProductAmount({productId, amount: updatedProductAmount}) :
        setCart(newCart)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }else{
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
        toast.error('Erro na adição do produto');
    }
    console.timeEnd("Execution time1")
  };

  const removeProduct = (productId: number) => {
    try {
      if(cart.find(product=>product.id===productId) === undefined){
        throw Error
      }
      let newCart = cart.filter(product=>product.id!==productId)
      
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    }catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0){
        throw Error
      }

      const stock = await api.get(`/stock/${productId}`);

      if(stock.data.amount < amount){
        toast.error('Quantidade solicitada fora de estoque');
      }else{
        if (cart.find(product => product.id === productId)===undefined){
          throw Error
        } 
        let newCart = cart.map((product)=>{
          return product.id === productId ? {
            ...product,
            amount: amount
          }:
          product
        })
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
