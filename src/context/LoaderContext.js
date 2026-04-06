import { createContext, useContext, useState, useEffect } from "react";

const LoaderContext = createContext({ loaderDone: true, dismissLoader: () => {} });

export const LoaderProvider = ({ children }) => {
  const [loaderDone, setLoaderDone] = useState(
    () => !!sessionStorage.getItem("loaderShown")
  );

  const dismissLoader = () => {
    sessionStorage.setItem("loaderShown", "1");
    setLoaderDone(true);
  };

  return (
    <LoaderContext.Provider value={{ loaderDone, dismissLoader }}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);

export default LoaderContext;
