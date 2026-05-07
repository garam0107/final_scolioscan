
import * as React from "react";
import { Text, TextStyle, StyleProp } from "react-native";

type LaListItemProps = {
  	children: React.ReactNode;
  	style?: StyleProp<TextStyle>;
    		};
    		
    		const ListItem = ({ children, style }: LaListItemProps)=> {
      			return <Text style={style}>{children}</Text>;
    		}
    		export default ListItem;
    		